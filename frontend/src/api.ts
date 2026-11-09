/**
 * Cliente HTTP SAME-ORIGIN: /api se resuelve mediante proxy Vite (desarrollo)
 * o Pages Function (sitio publicado). El navegador nunca contacta a Ollama.
 * La clave de laboratorio se escribe a mano y vive en la sesión del navegador,
 * nunca en VITE_*, el repositorio ni el JavaScript compilado.
 */
import type { Mode, RunResult, ScenarioId, HistoryItem } from './types'

const STORAGE_KEY = 'guardian-live-key-v03'
export function getGuardianKey(): string {
  try { return sessionStorage.getItem(STORAGE_KEY) || '' } catch { return '' }
}
export function setGuardianKey(key: string): void {
  try { sessionStorage.setItem(STORAGE_KEY, key.trim()) } catch { /* almacenamiento deshabilitado */ }
}
export function clearGuardianKey(): void {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* sin almacenamiento */ }
}

async function getJson<T>(path: string, options?: RequestInit): Promise<T> {
  const key = getGuardianKey()
  if (key.length < 32) throw new Error('Ingresá la clave de laboratorio (mínimo 32 caracteres)')
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'omit',
    cache: 'no-store',
    redirect: 'error',
    headers: {
      'Content-Type': 'application/json',
      'X-Guardian-Key': key,
      ...options?.headers,
    },
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('No llegó JSON: revisá backend, túnel y Pages Function')
  const body = await response.json()
  if (!response.ok) {
    throw new Error((typeof body?.detail === 'string' ? body.detail : '') || `HTTP ${response.status}`)
  }
  return body as T
}
export function getHealth() { return getJson<{ status: string; python: string; model_ready: boolean }>('/health') }
export function getOllama() { return getJson<{ reachable: boolean; model: string; installed: boolean; available_models?: string[] }>('/ollama') }
export function getDashboard() { return getJson<{ counters: { runs: number; resolved: number }; runs: HistoryItem[]; model_ready: boolean }>('/dashboard') }
export function runPipeline(scenario: ScenarioId, mode: Mode, use_llm: boolean, approve_action = false) {
  return getJson<RunResult>('/run', { method: 'POST', body: JSON.stringify({ scenario, mode, use_llm, approve_action }) })
}
