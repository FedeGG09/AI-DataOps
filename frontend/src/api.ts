/** Guardian v0.4: una clave fija validada en Cloudflare y FastAPI. */
import type { Mode, RunResult, ScenarioId } from './types'

const STORAGE_KEY = 'guardian-ui-access-v04'

export function getAccessKey(): string {
  try { return sessionStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}
export function saveAccessKey(key: string): void {
  try { sessionStorage.setItem(STORAGE_KEY, key.trim()) } catch { /* navegador restringido */ }
}
export function clearAccessKey(): void {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* navegador restringido */ }
}

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const key = getAccessKey()
  if (key.length < 32) throw new Error('Ingresá la clave de acceso (mínimo 32 caracteres).')
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'error',
      headers: {
        'Accept': 'application/json',
        'X-Guardian-Key': key,
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('No se puede contactar la API. Revisá FastAPI, el túnel y Cloudflare Pages.')
  }
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`La API devolvió HTTP ${response.status} sin JSON. Revisá la configuración del túnel.`)
  }
  const payload: unknown = await response.json()
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null && 'detail' in payload
      && typeof payload.detail === 'string' ? payload.detail : `HTTP ${response.status}`
    throw new Error(detail)
  }
  return payload as T
}

export function getHealth() {
  return requestJson<{ status: string; python: string; model_ready: boolean; version: string }>('/health')
}
export function getOllama() {
  return requestJson<{ reachable: boolean; model: string; installed: boolean }>('/ollama')
}
export function runPipeline(scenario: ScenarioId, mode: Mode, use_llm: boolean, approve_action = false) {
  return requestJson<RunResult>('/run', {
    method: 'POST',
    body: JSON.stringify({ scenario, mode, use_llm, approve_action }),
  })
}
