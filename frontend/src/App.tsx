import { useEffect, useState } from 'react'
import {
  Activity, ArrowRight, CheckCircle2, ChevronDown, CircleAlert, Code2,
  GitBranch, KeyRound, LockKeyhole, Play, RefreshCw, ShieldCheck,
  Sparkles, TerminalSquare, X, Zap,
} from 'lucide-react'
import { scenarios } from './demo'
import { clearAccessKey, getAccessKey, getHealth, getOllama, runPipeline, saveAccessKey } from './api'
import type { Mode, RunResult, ScenarioId } from './types'

const modeNames: Record<Mode, string> = {
  script: 'Script',
  pipeline: 'Pipeline',
  agent: 'Agente IA',
}
const scenarioNames = Object.fromEntries(scenarios.map(s => [s.id, s.name])) as Record<ScenarioId, string>
const metricNames: Record<string, string> = {
  rows: 'Registros', predicted_churn: 'Predicciones churn', max_psi: 'PSI máximo',
  accuracy: 'Accuracy', precision: 'Precisión', recall: 'Recall',
}
const statuses: Record<RunResult['status'], { label: string; tone: string }> = {
  success: { label: 'Completado', tone: 'success' },
  warning: { label: 'Advertencia', tone: 'warning' },
  error: { label: 'Error', tone: 'error' },
  needs_approval: { label: 'Requiere aprobación', tone: 'warning' },
}

function formatMetric(value: number | null): string {
  if (value === null) return '—'
  return Number.isInteger(value) ? value.toLocaleString('es-AR') : value.toLocaleString('es-AR', { maximumFractionDigits: 3 })
}

export default function App() {
  const [keyInput, setKeyInput] = useState(getAccessKey)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [model, setModel] = useState('')
  const [scenario, setScenario] = useState<ScenarioId>('schema_change')
  const [mode, setMode] = useState<Mode>('agent')
  const [useLLM, setUseLLM] = useState(true)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResult | null>(null)
  const [message, setMessage] = useState('')

  async function connect(key = keyInput) {
    setConnecting(true)
    setMessage('')
    setConnected(false)
    saveAccessKey(key)
    try {
      const health = await getHealth()
      if (health.status !== 'ok') throw new Error('El servidor no devolvió un estado válido.')
      setConnected(true)
      try {
        const ollama = await getOllama()
        setModel(ollama.reachable && ollama.installed ? ollama.model : 'Ollama no disponible')
      } catch {
        setModel('Ollama sin verificar')
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'No se pudo conectar.')
    } finally {
      setConnecting(false)
    }
  }

  useEffect(() => {
    const savedKey = getAccessKey()
    if (savedKey) void connect(savedKey)
    // Cargar automáticamente la sesión si el docente ya se autenticó en esta pestaña.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function execute(approved = false) {
    if (!connected || running) return
    setRunning(true)
    setMessage('')
    try {
      setResult(await runPipeline(scenario, mode, mode === 'agent' && useLLM, approved))
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error inesperado al ejecutar.')
    } finally {
      setRunning(false)
    }
  }

  function disconnect() {
    clearAccessKey()
    setKeyInput('')
    setConnected(false)
    setModel('')
    setResult(null)
    setMessage('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol" aria-hidden="true"><span /></div>
          <div className="brand-text"><strong>AI DATAOPS</strong><small>GUARDIAN <i>/ LAB</i></small></div>
        </div>
        <div className="topbar-right">
          <span className="version">GUARDIAN · v0.4</span>
          <span className={`connect-indicator ${connected ? 'is-online' : ''}`}>
            <span className="indicator-dot" /> {connected ? 'Motor conectado' : 'Motor desconectado'}
          </span>
        </div>
      </header>

      <main className="page">
        <section className="intro">
          <div>
            <span className="eyebrow"><span className="line" /> AI AUTOMATION · DATA SCIENCE</span>
            <h1>Ejecutor de<br/><em>incidentes</em></h1>
            <p>Seleccioná · Ejecutá · Revisá</p>
          </div>
          <div className="sun-art" aria-hidden="true">
            <div className="sun-disc"/><div className="sun-stripes"><i/><i/><i/><i/></div>
          </div>
        </section>

        <section className="connect-panel" aria-label="Conexión a Guardian">
          <div className="connection-title">
            <div className="lock-icon"><LockKeyhole size={19} /></div>
            <div><strong>Conexión al motor</strong><small>{connected ? `FastAPI activo${model ? ` · ${model}` : ''}` : 'Ingresá la clave del laboratorio para ejecutar.'}</small></div>
          </div>
          <div className="connect-form">
            {connected ? (
              <>
                <span className="connected-chip"><CheckCircle2 size={17} /> Conectado</span>
                <button type="button" className="secondary-compact" onClick={disconnect}>Desconectar</button>
              </>
            ) : (
              <>
                <label className="sr-only" htmlFor="access-key">Clave del laboratorio</label>
                <input id="access-key" type="password" autoComplete="off" value={keyInput} placeholder="Clave de acceso" onChange={e => setKeyInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && keyInput.trim().length >= 32) void connect() }} />
                <button type="button" className="connect-btn" disabled={connecting || keyInput.trim().length < 32} onClick={() => void connect()}>
                  {connecting ? <RefreshCw className="spinning" size={16}/> : <KeyRound size={16}/>} {connecting ? 'Verificando…' : 'Conectar'}
                </button>
              </>
            )}
          </div>
        </section>

        {message && <div className="alert" role="alert"><CircleAlert size={18}/><span>{message}</span><button aria-label="Cerrar aviso" onClick={() => setMessage('')}><X size={16}/></button></div>}

        <section className="lab-grid">
          <div className="task-panel">
            <div className="panel-heading"><span className="eyebrow">01 / CONFIGURACIÓN</span><h2>Preparar ejecución</h2></div>
            <label className="field-label" htmlFor="scenario">Incidente</label>
            <div className="select-box"><select id="scenario" value={scenario} onChange={e => { setScenario(e.target.value as ScenarioId); setResult(null) }}>
              {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select><ChevronDown size={18}/></div>


            <span className="field-label mode-label">Modo de ejecución</span>
            <div className="mode-options" role="group" aria-label="Modo de ejecución">
              <button aria-pressed={mode === 'script'} className={mode === 'script' ? 'chosen' : ''} onClick={() => {setMode('script');setResult(null)}}><Code2 size={21}/><span>Script</span></button>
              <button aria-pressed={mode === 'pipeline'} className={mode === 'pipeline' ? 'chosen' : ''} onClick={() => {setMode('pipeline');setResult(null)}}><GitBranch size={21}/><span>Pipeline</span></button>
              <button aria-pressed={mode === 'agent'} className={mode === 'agent' ? 'chosen' : ''} onClick={() => {setMode('agent');setResult(null)}}><Sparkles size={21}/><span>Agente IA</span></button>
            </div>
            {mode === 'agent' && <label className="llm-control"><input type="checkbox" checked={useLLM} onChange={e => setUseLLM(e.target.checked)}/><span className="switch-track"/><span><strong>Usar Llama 3.1 local</strong></span></label>}
            <button className="execute-btn" type="button" disabled={!connected || running} onClick={() => void execute()}>
              {running ? <RefreshCw size={19} className="spinning"/> : <Play size={19} fill="currentColor"/>}
              {running ? 'Ejecutando…' : 'Ejecutar incidente'} <ArrowRight size={19}/>
            </button>
            {!connected && <p className="muted-caption"><LockKeyhole size={13}/> Conectá el motor para ejecutar</p>}
          </div>

          <div className="output-panel">
            <div className="panel-heading output-heading"><div><span className="eyebrow">02 / RESULTADO</span><h2>Salida de ejecución</h2></div><TerminalSquare size={23} strokeWidth={1.7}/></div>
            {!result ? <div className="empty-state">
              <div className="empty-icon"><Activity size={31} strokeWidth={1.7}/></div>
              <strong>{running ? 'Procesando incidente…' : 'Listo para ejecutar'}</strong>
              <p>{running ? 'Esperando la respuesta del motor.' : 'El resultado aparecerá aquí.'}</p>
            </div> : (
              <div className="result-body">
                <div className="result-line"><span className={`status-pill ${statuses[result.status].tone}`}>{statuses[result.status].label}</span><span className="run-id">{result.run_id}</span></div>
                <h3>{scenarioNames[result.scenario]} <small>· {modeNames[result.mode]}</small></h3>
                <p className="result-summary">{result.summary}</p>
                {Object.keys(result.metrics).length > 0 && <div className="metrics">
                  {Object.entries(result.metrics).map(([name, value]) => <div className="metric" key={name}><small>{metricNames[name] || name.replace(/_/g, ' ')}</small><strong>{formatMetric(value)}</strong></div>)}
                </div>}
                <h4>Eventos</h4>
                <div className="events">
                  {result.events.map((event, index) => <div className="event" key={`${result.run_id}-${index}`}><span className={`event-mark ${event.status}`} /> <div><strong>{event.name}</strong><p>{event.detail}</p></div></div>)}
                </div>
                {result.agent_trace.length > 0 && <details className="trace"><summary>Ver traza del agente ({result.agent_trace.length})</summary><div className="events">
                  {result.agent_trace.map((step, index) => <div className="event" key={index}><span className="event-num">{step.step}</span><div><strong>{step.type}{step.tool ? ` · ${step.tool}` : ''}</strong><p>{step.detail}</p></div></div>)}
                </div></details>}
                {result.proposal?.requires_approval && <div className="approval-box"><div><ShieldCheck size={19}/><strong>Acción pendiente de aprobación</strong></div><p>{result.proposal.description}</p><button type="button" disabled={running || !connected || !result.proposal.can_execute} onClick={() => void execute(true)}>Aprobar y ejecutar <ArrowRight size={16}/></button></div>}
                {result.llm_status && <p className="engine-info"><Zap size={13}/> LLM: {result.llm_status}</p>}
              </div>
            )}
          </div>
        </section>
        <footer><span>AI DATAOPS GUARDIAN</span><span>Motor local · Interfaz web</span></footer>
      </main>
    </div>
  )
}
