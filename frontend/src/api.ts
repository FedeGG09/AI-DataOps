/** Cliente HTTP local. No enviamos secretos al navegador ni llamamos a Ollama directamente. */
import type { Mode, RunResult, ScenarioId, HistoryItem } from './types'

async function getJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } })
  if (!response.ok) throw new Error(`API HTTP ${response.status}: ${response.statusText}`)
  // Cloudflare puede devolver index.html para /api/*; esto evita falsos positivos.
  if (!(response.headers.get('content-type') || '').includes('application/json')) {
    throw new Error('La ruta no devolvió JSON: no hay backend conectado')
  }
  return response.json() as Promise<T>
}
export function getHealth() { return getJson<{ status: string; python: string; model_ready: boolean }>('/health') }
export function getOllama() { return getJson<{ reachable: boolean; model: string; installed: boolean; available_models?: string[] }>('/ollama') }
export function getDashboard() { return getJson<{ counters: { runs: number; resolved: number }; runs: HistoryItem[]; model_ready: boolean }>('/dashboard') }
export function runPipeline(scenario: ScenarioId, mode: Mode, use_llm: boolean, approve_action = false) {
  return getJson<RunResult>('/run', { method: 'POST', body: JSON.stringify({ scenario, mode, use_llm, approve_action }) })
}
