/** Contratos compartidos conceptualmente con los modelos Pydantic del backend. */
export type ScenarioId = 'normal' | 'schema_change' | 'null_values' | 'api_failure' | 'drift' | 'duplicates'
export type Mode = 'script' | 'pipeline' | 'agent'
export type RunStatus = 'success' | 'warning' | 'error' | 'needs_approval'
export interface Scenario {
  id: ScenarioId
  name: string
  description: string
  concept: string
}
export interface RunEvent {
  name: string
  detail: string
  status: 'ok' | 'warning' | 'error' | 'info'
}
export interface Proposal {
  action_id: string
  description: string
  requires_approval: boolean
  can_execute: boolean
}
export interface RunResult {
  run_id: string
  mode: Mode
  scenario: ScenarioId
  status: RunStatus
  summary: string
  events: RunEvent[]
  metrics: Record<string, number | null>
  proposal: Proposal | null
  llm_status: string
  agent_trace: Array<{ step: number; type: string; tool?: string; detail: string }>
}
export interface HistoryItem {
  run_id: string
  created_at: string
  scenario: ScenarioId
  mode: Mode
  status: RunStatus
  summary: string
  metrics: Record<string, number | null>
}
