/** Modo offline: simulación explícita para usar desde Cloudflare sin backend. */
import type { Mode, RunResult, Scenario, ScenarioId, RunEvent } from './types'
export const scenarios: Scenario[] = [
  { id: 'normal', name: 'Operación normal', description: 'Dataset correcto, sin anomalías', concept: 'Reproducibilidad' },
  { id: 'schema_change', name: 'Cambio de esquema', description: 'monthly_spend pasa a llamarse monthly_expense', concept: 'Adaptabilidad' },
  { id: 'null_values', name: 'Valores faltantes', description: '20% de gastos faltantes', concept: 'Calidad de datos' },
  { id: 'api_failure', name: 'API intermitente', description: 'HTTP 503 durante dos intentos', concept: 'Retries y backoff' },
  { id: 'drift', name: 'Data drift', description: 'Cambian las distribuciones del negocio', concept: 'PSI / monitoreo' },
  { id: 'duplicates', name: 'IDs duplicados', description: '30 clientes repetidos', concept: 'Data quality' },
]
const proposals: Partial<Record<ScenarioId, [string, string]>> = {
  schema_change: ['rename_column', 'Validar el alias monthly_expense → monthly_spend'],
  null_values: ['impute_median', 'Imputar con la mediana y volver a validar'],
  duplicates: ['deduplicate', 'Eliminar clientes duplicados y revalidar'],
}
const ev = (name: string, detail: string, status: RunEvent['status'] = 'info'): RunEvent => ({ name, detail, status })

export function demoRun(scenario: ScenarioId, mode: Mode, approved = false): RunResult {
  const run_id = `demo-${Date.now().toString(36)}`
  const events: RunEvent[] = [ev('Carga de dataset', '250 registros sintéticos (simulación del navegador)', 'ok')]
  const issues: Partial<Record<ScenarioId, string>> = {
    schema_change: 'KeyError: columna monthly_spend no encontrada',
    null_values: 'ValueError: se detectaron valores NaN',
    duplicates: 'Se encontraron 30 clientes duplicados',
    api_failure: 'HTTP 503: servidor temporalmente no disponible',
    drift: 'El comportamiento de entrada cambió: PSI máximo 8.72',
  }
  let status: RunResult['status'] = 'success'
  let summary = 'Ejecución finalizada correctamente con datos de prueba.'
  if (scenario === 'api_failure' && mode !== 'script') {
    events.push(ev('Retry 1/3', 'HTTP 503; se prepara nuevo intento', 'warning'))
    events.push(ev('Retry 2/3', 'HTTP 503; se prepara nuevo intento', 'warning'))
    events.push(ev('Retry 3/3', 'HTTP 200; fuente recuperada', 'ok'))
  } else if (scenario !== 'normal' && scenario !== 'drift' && !(scenario === 'duplicates' && mode === 'script')) {
    events.push(ev('Control de entrada', issues[scenario] ?? 'Anomalía', 'error'))
    status = 'error'
    summary = mode === 'script' ? `El script se detuvo. ${issues[scenario]}` : `Validación fallida. ${issues[scenario]}`
  }
  if (scenario === 'duplicates' && mode === 'script') {
    summary = 'El script terminó, pero contó clientes duplicados como registros independientes.'
    events.push(ev('Inferencia sin control de duplicados', 'Se produjeron 280 filas de salida', 'warning'))
  }
  if (scenario === 'drift') {
    if (mode === 'script') {
      summary = 'El script terminó sin detectar el cambio de distribución.'
    } else {
      status = 'warning'
      summary = 'Monitoreo detectó data drift; revisar el modelo con etiquetas reales.'
      events.push(ev('PSI / Data drift', 'PSI > 0.25: alerta estadística', 'warning'))
    }
  }
  const item = proposals[scenario]
  let proposal: RunResult['proposal'] = null
  if (mode === 'agent') {
    if (item) {
      proposal = { action_id: item[0], description: item[1], requires_approval: true, can_execute: true }
      if (!approved) {
        status = 'needs_approval'
        summary = 'Se requiere aprobación humana para aplicar una corrección.'
        events.push(ev('Human-in-the-loop', `Propuesta: ${item[1]}`, 'warning'))
      } else {
        status = 'success'
        summary = 'Corrección autorizada y revalidada (simulación).'
        events.push(ev('Aprobación humana', `Acción aplicada: ${item[0]}`, 'ok'))
        events.push(ev('Revalidación', 'Todas las comprobaciones finalizadas', 'ok'))
      }
    }
    events.push(ev('Agente didáctico', 'Simulación basada en reglas. No se llamó a Ollama.', 'info'))
  }
  if (status === 'success') events.push(ev('Resultado', 'Datos procesados y predicciones disponibles', 'ok'))
  return {
    run_id, scenario, mode, status, summary, events, proposal,
    metrics: status === 'error' || status === 'needs_approval' ? { rows: scenario === 'duplicates' ? 280 : 250 } : {
      rows: scenario === 'duplicates' && mode === 'script' ? 280 : 250,
      predicted_churn: scenario === 'drift' ? 196 : 91,
      ...(mode !== 'script' ? { max_psi: scenario === 'drift' ? 8.72 : 0.06 } : {}),
    },
    llm_status: 'demo_browser_no_llm', agent_trace: [],
  }
}
