/**
 * AI DataOps Guardian — laboratorio de la Diplomatura.
 * UI deliberadamente desacoplada del backend: Cloudflare opera en modo DEMO.
 * Cuando React se sirve localmente con Vite, /api se resuelve con el proxy local.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, BookOpen, Bot, Boxes, BrainCircuit, Check, CheckCircle2,
  ChevronDown, CircleAlert, Clock3, Cloud, Code2, Database, GitBranch,
  Globe2, History, Layers3, Menu, Play, RefreshCw, Server,
  ShieldCheck, Terminal, X, Zap,
} from 'lucide-react'
import type { HistoryItem, Mode, RunEvent, RunResult, ScenarioId, RunStatus } from './types'
import { demoRun, scenarios } from './demo'
import { buildInfo } from './buildInfo'
import { getDashboard, getHealth, getOllama, runPipeline } from './api'

type View = 'dashboard' | 'laboratory' | 'architecture' | 'learning' | 'history' | 'cicd'
const localHost = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const nav: Array<{ id: View; title: string; icon: typeof Activity }> = [
  { id: 'dashboard', title: 'Overview', icon: Activity },
  { id: 'laboratory', title: 'Laboratorio', icon: Zap },
  { id: 'architecture', title: 'Arquitectura', icon: GitBranch },
  { id: 'learning', title: 'Guía docente', icon: BookOpen },
  { id: 'history', title: 'Historial', icon: History },
  { id: 'cicd', title: 'CI/CD en vivo', icon: GitBranch },
]
const modeLabels: Record<Mode, string> = { script: 'Script rígido', pipeline: 'Pipeline MLOps', agent: 'Agente IA' }
const statusLabels: Record<RunStatus, string> = {
  success: 'Completado', warning: 'Advertencia', error: 'Error', needs_approval: 'Requiere aprobación',
}
const conceptRows = [
  ['Script rígido', 'Flujo lineal sin controles ni adaptación', 'script'],
  ['Orquestación', 'Tareas, dependencia, errores y reintentos', 'pipeline'],
  ['Agente autónomo', 'Observa, consulta herramientas y propone acciones', 'agent'],
  ['Human-in-the-loop', 'La persona aprueba cualquier cambio de datos', 'agent'],
  ['MLOps', 'Modelo, trazabilidad, datos de referencia y drift', 'pipeline'],
  ['Reproducibilidad', 'Dockerfile, Dev Containers y variables de entorno', 'setup'],
]

function IconBubble({ children, tone = 'mint' }: { children: ReactNode; tone?: string }) {
  return <div className={`icon-bubble ${tone}`}>{children}</div>
}
function StatusTag({ status }: { status: RunStatus }) {
  return <span className={`status-tag ${status}`}><span className="status-dot" />{statusLabels[status]}</span>
}
function EventRow({ event, index }: { event: RunEvent; index: number }) {
  const icon = event.status === 'error' ? <X size={15}/> : event.status === 'warning' ? <CircleAlert size={15}/> : <Check size={15}/>
  return <div className="event-row">
    <span className={`event-icon ${event.status}`}>{icon}</span>
    <div className="event-copy"><div className="event-name"><span>{String(index + 1).padStart(2, '0')}</span> {event.name}</div><p>{event.detail}</p></div>
  </div>
}
function LineChart({ high = false }: { high?: boolean }) {
  const a = high ? [31, 35, 31, 37, 45, 43, 54, 71, 68, 81, 94, 87] : [28, 32, 27, 31, 35, 30, 38, 34, 33, 39, 34, 37]
  const b = [35, 33, 30, 33, 36, 31, 35, 37, 34, 39, 35, 32]
  const poly = (data: number[]) => data.map((v, i) => `${30 + i * 35},${146 - v * 1.15}`).join(' ')
  return <div className="chart-wrap">
    <svg viewBox="0 0 470 170" role="img" aria-label="Gráfico didáctico de distribución y drift" preserveAspectRatio="none">
      {[30, 65, 100, 135].map(y => <line key={y} x1="30" y1={y} x2="455" y2={y} stroke="#2a3653" strokeDasharray="3 6"/>) }
      <polyline points={poly(b)} fill="none" stroke="#52617e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points={poly(a)} fill="none" stroke="#5de0b1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {a.map((v, i) => <circle key={i} cx={30 + i * 35} cy={146 - v * 1.15} r={i === a.length - 1 ? 4 : 0} fill="#5de0b1"/>)}
      {['ENE', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV'].map((label, i) => <text key={label} x={31 + i * 70} y="164" fill="#77829a" fontSize="10">{label}</text>)}
    </svg>
    <div className="chart-legend"><span><i className="legend-dot mint"/>Datos recientes</span><span><i className="legend-dot grey"/>Referencia</span></div>
  </div>
}
function Architecture() {
  return <div className="panel spacious architecture-view">
    <div className="section-heading"><span className="eyebrow">DISEÑO DEL SISTEMA</span><h2>Cómo funciona Guardian</h2><p>Separación por responsabilidad, no por complejidad accidental.</p></div>
    <div className="arch-grid">
      <div className="arch-node bright"><Cloud size={24}/><b>Frontend React</b><small>Cloudflare Pages · Vite</small><span>Panel de laboratorio + modo demo</span></div>
      <div className="arch-arrow"><ArrowRight size={24}/><small>HTTP / API</small></div>
      <div className="arch-node"><Server size={24}/><b>FastAPI local</b><small>127.0.0.1:8000</small><span>Validación, orquestación y auditoría</span></div>
    </div>
    <div className="arch-pieces">
      <div><IconBubble><Database size={19}/></IconBubble><b>Data Science</b><span>Pandas · Scikit-learn · PSI</span></div>
      <div><IconBubble tone="blue"><Layers3 size={19}/></IconBubble><b>MLOps</b><span>Prefect · MLflow opcionales</span></div>
      <div><IconBubble tone="purple"><Bot size={19}/></IconBubble><b>Agente local</b><span>Ollama / Llama 3.1 · Tool calling</span></div>
      <div><IconBubble tone="gold"><ShieldCheck size={19}/></IconBubble><b>Control humano</b><span>Catálogo de acciones seguras</span></div>
    </div>
    <div className="hint"><ShieldCheck size={18}/><span>Un frontend público NO accede directamente a Ollama ni a una API privada. En Cloudflare la demo es autónoma; para ejecutar el laboratorio real abrí React localmente.</span></div>
  </div>
}
function Learning({ onNavigate }: { onNavigate: (v: View) => void }) {
  return <div className="panel spacious">
    <div className="section-heading"><span className="eyebrow">UNIDAD 01 · DIPLOMATURA</span><h2>Guía docente interactiva</h2><p>El laboratorio conecta teoría, fallos controlados y código reproducible.</p></div>
    <div className="learning-grid">{conceptRows.map(([title, description, mode], i) =>
      <button className="learning-card" key={title} onClick={() => onNavigate(mode === 'setup' ? 'architecture' : 'laboratory')}>
        <span className="learning-no">0{i+1}</span><b>{title}</b><p>{description}</p><span className="learning-link">Explorar <ArrowRight size={14}/></span>
      </button>
    )}</div>
    <div className="hint"><BookOpen size={19}/><span>Checkpoint real de la Unidad 1: estructura de carpetas, Dockerfile, Dev Container, .env.example y check_env.py ejecutado dentro del contenedor.</span></div>
  </div>
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [connected, setConnected] = useState(false)
  const [source, setSource] = useState<'demo' | 'local'>(localHost ? 'local' : 'demo')
  const [scenario, setScenario] = useState<ScenarioId>('schema_change')
  const [mode, setMode] = useState<Mode>('script')
  const [useLLM, setUseLLM] = useState(true)
  const [busy, setBusy] = useState(false)
  const [run, setRun] = useState<RunResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [ollama, setOllama] = useState<string>('Sin consultar')
  const [notice, setNotice] = useState('')
  const onNavigate = (v: View) => { setView(v); setMenuOpen(false) }

  async function refresh() {
    if (source !== 'local') { setConnected(false); setOllama('No disponible en modo demo'); return }
    try {
      const health = await getHealth()
      if (health.status !== 'ok') throw new Error('API no disponible')
      setConnected(true)
      const result = await getDashboard()
      setHistory(result.runs)
      try {
        const o = await getOllama()
        setOllama(o.reachable ? (o.installed ? `Listo: ${o.model}` : `Modelo ${o.model} no instalado`) : 'Servicio Ollama apagado')
      } catch { setOllama('No se pudo consultar Ollama') }
      setNotice('Backend local disponible')
    } catch {
      setConnected(false)
      setOllama('Backend local desconectado')
      setNotice('No se detectó FastAPI. Podés cambiar a modo demostración.')
    }
  }
  useEffect(() => { void refresh() }, [source]) // eslint-disable-line react-hooks/exhaustive-deps

  async function execute(approve = false) {
    if (busy) return
    setBusy(true)
    setNotice('')
    try {
      let result: RunResult
      if (source === 'local') {
        if (!connected) throw new Error('Backend no conectado. Iniciá scripts/iniciar-backend.ps1 o seleccioná modo demostración.')
        result = await runPipeline(scenario, mode, useLLM, approve)
        const data = await getDashboard()
        setHistory(data.runs)
      } else result = demoRun(scenario, mode, approve)
      setRun(result)
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Error inesperado')
    } finally { setBusy(false) }
  }
  const stats = useMemo(() => {
    const runs = history.length + (source === 'demo' && run ? 1 : 0)
    const hasDrift = run?.metrics?.max_psi !== undefined && run?.metrics?.max_psi !== null
    return [
      { label: 'Ejecuciones registradas', value: source === 'demo' ? (run ? '01' : '00') : `${runs}`.padStart(2, '0'), icon: Terminal, caption: 'Sesión de laboratorio', tone: 'mint' },
      { label: 'Escenarios disponibles', value: '06', icon: Boxes, caption: 'Incidentes reproducibles', tone: 'blue' },
      { label: 'PSI máximo', value: hasDrift ? String(run?.metrics.max_psi) : '—', icon: Activity, caption: 'Calculado en pipeline', tone: 'gold' },
      { label: 'Motor de ejecución', value: source === 'demo' ? 'DEMO' : connected ? 'LOCAL' : 'OFF', icon: Server, caption: source === 'demo' ? 'Simulación del navegador' : 'FastAPI + CPU', tone: 'purple' },
    ]
  }, [history, source, run, connected])

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-logo"><Activity size={24} strokeWidth={2.4}/></div><div><b>AI DATAOPS</b><span>GUARDIAN <i> / LAB</i></span></div></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="navigation">{nav.map(item => <button key={item.id} onClick={() => onNavigate(item.id)} className={view === item.id ? 'active' : ''}><item.icon size={18}/>{item.title}{item.id === 'laboratory' && <span className="nav-mini">06</span>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-info"><div className="tiny-icon"><BookOpen size={16}/></div><div><b>Fundamentos de IA</b><span>Diplomatura · Unidad 01</span></div></div>
        <div className="sidebar-separator"/>
        <div className="online-status"><span className={`status-led ${connected ? 'online' : ''}`}/><span>{source === 'demo' ? 'Simulación en navegador' : connected ? 'Motor local conectado' : 'Backend sin conexión'}</span></div>
        <span className="sidebar-version">Versión {buildInfo.version} · Docente</span>
      </div>
    </aside>
    <div className="main-frame">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú"><Menu size={21}/></button>
        <div className="breadcrumbs"><span>WORKSPACE</span><span className="slash">/</span><strong>{nav.find(x => x.id === view)?.title}</strong></div>
        <div className="top-actions"><span className="top-unit"><Layers3 size={15}/> UNIDAD 01</span><button className="round-btn" title="Verificar conexiones" onClick={() => void refresh()}><RefreshCw size={16}/></button><div className="avatar">DS</div></div>
      </header>
      <main className="content">
        <div className="hero-row"><div><div className="eyebrow"><span className="eyebrow-line"/> AI AUTOMATION · DATA SCIENCE</div><h1>{view === 'dashboard' ? 'Centro de operaciones' : view === 'laboratory' ? 'Laboratorio de incidentes' : view === 'architecture' ? 'Arquitectura del sistema' : view === 'learning' ? 'Guía de aprendizaje' : view === 'history' ? 'Historial de ejecuciones' : 'CI/CD y despliegues'}</h1><p className="hero-subtitle">De scripts rígidos a sistemas que observan, validan y toman decisiones supervisadas.</p></div><span className="hero-pill"><span className="pulse-dot"/> ENTORNO EDUCATIVO</span></div>
        <div className="connection-banner">
          <div className="connection-main"><IconBubble tone={source === 'local' ? 'mint' : 'blue'}>{source === 'local' ? <Server size={19}/> : <Globe2 size={19}/>}</IconBubble><div><b>{source === 'demo' ? 'Modo demostración — Cloudflare compatible' : connected ? 'Backend FastAPI conectado' : 'Backend local sin conexión'}</b><span>{source === 'demo' ? 'Los resultados son ilustrativos. No se ejecuta Python ni Ollama.' : connected ? `Python y modelos corriendo en tu PC · ${ollama}` : 'Iniciá el servicio local desde PowerShell para ejecutar código real.'}</span></div></div>
          <div className="connection-actions"><select value={source} onChange={e => { setSource(e.target.value as 'demo' | 'local'); setRun(null) }} aria-label="Origen de ejecución"><option value="demo">Demo</option>{localHost && <option value="local">Local</option>}</select><button className="outline-button" onClick={() => void refresh()}><RefreshCw size={15}/> Verificar</button></div>
        </div>
        {notice && <div className="notice"><CircleAlert size={16}/>{notice}<button onClick={() => setNotice('')} aria-label="Cerrar"><X size={15}/></button></div>}

        {(view === 'dashboard' || view === 'laboratory') && <>
          <div className="metric-grid">{stats.map(item => <div className="metric-card" key={item.label}><div className="metric-top"><span>{item.label}</span><IconBubble tone={item.tone}><item.icon size={18}/></IconBubble></div><b>{item.value}</b><small>{item.caption}</small></div>)}</div>
          <div className="work-grid">
            <section className="panel lab-panel"><div className="panel-title"><div><span className="eyebrow">EXPERIMENTO INTERACTIVO</span><h2>Simulador de incidentes</h2></div><span className="panel-pill">LAB 01—06</span></div>
              <label className="field-label" htmlFor="scenario">01 — Seleccioná un escenario</label>
              <div className="select-wrap"><select id="scenario" value={scenario} onChange={e => { setScenario(e.target.value as ScenarioId); setRun(null) }}>{scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown size={17}/></div>
              <p className="field-help">{scenarios.find(s => s.id === scenario)?.description}</p>
              <label className="field-label">02 — Elegí cómo resolverlo</label>
              <div className="mode-tabs">{(['script', 'pipeline', 'agent'] as Mode[]).map(m => <button key={m} onClick={() => { setMode(m); setRun(null) }} className={mode === m ? 'selected' : ''}>{m === 'script' ? <Code2 size={17}/> : m === 'pipeline' ? <GitBranch size={17}/> : <Bot size={17}/>}<span>{modeLabels[m]}</span></button>)}</div>
              {mode === 'agent' && <label className="switch-row"><input type="checkbox" checked={useLLM} onChange={e => setUseLLM(e.target.checked)}/><span className="switch-track"/><div><b>Habilitar Llama 3.1 local</b><small>{source === 'demo' ? 'En la web pública solo se simula' : 'Consulta real mediante Ollama en 127.0.0.1'}</small></div></label>}
              <button className="primary-button" disabled={busy} onClick={() => void execute()}>{busy ? <RefreshCw size={18} className="spin"/> : <Play size={17} fill="currentColor"/>}{busy ? 'Ejecutando...' : 'Ejecutar experimento'}<ArrowRight size={17}/></button>
              <div className="lab-help"><ShieldCheck size={16}/><span>Dataset sintético · Ejecuciones auditables · Cambios sujetos a aprobación</span></div>
            </section>
            <section className="panel result-panel"><div className="panel-title"><div><span className="eyebrow">OBSERVABILIDAD</span><h2>Consola de ejecución</h2></div><span className="terminal-icon"><Terminal size={19}/></span></div>
              {run ? <>
                <div className="result-top"><StatusTag status={run.status}/><span className="run-id">ID {run.run_id}</span></div>
                <div className="result-summary">{run.summary}</div>
                <div className="event-list">{run.events.map((e, i) => <EventRow key={`${i}-${e.name}`} event={e} index={i}/>)}</div>
                {run.proposal?.requires_approval && <div className="approval-box"><div className="approval-heading"><ShieldCheck size={17}/> CONTROL HUMANO</div><p>{run.proposal.description}</p>{run.status === 'needs_approval' ? <button onClick={() => void execute(true)} disabled={busy} className="approve-button"><CheckCircle2 size={16}/> Aprobar corrección y revalidar</button> : <span className="approved-label"><Check size={14}/> Acción ya evaluada</span>}</div>}
                {run.agent_trace.length > 0 && <details className="trace-details"><summary><BrainCircuit size={16}/> Ver herramientas utilizadas ({run.agent_trace.length})</summary><div>{run.agent_trace.map((t, i) => <p key={i}><b>{t.tool || t.type}</b>: {t.detail}</p>)}</div></details>}
              </> : <div className="empty-console"><div className="console-symbol"><Terminal size={29}/></div><h3>Todo listo para ejecutar</h3><p>Seleccioná un incidente y compará cómo responde cada nivel de automatización.</p><span>AWAITING EXPERIMENT_</span></div>}
            </section>
          </div>
          <div className="bottom-grid">
            <section className="panel insight-panel"><div className="panel-title"><div><span className="eyebrow">MONITOREO DE DATOS</span><h2>Distribución / Drift</h2></div><span className="panel-light"><Activity size={18}/></span></div><LineChart high={run?.scenario === 'drift' && run?.mode !== 'script'}/><div className="chart-foot"><span>{run?.metrics?.max_psi !== undefined ? `PSI máximo: ${run.metrics.max_psi}` : 'Visualización ilustrativa hasta ejecutar un pipeline'}</span><span>Curvas ilustrativas · PSI backend real</span></div></section>
            <section className="panel lessons-panel"><div className="panel-title"><div><span className="eyebrow">CONCEPTOS DE LA UNIDAD</span><h2>Qué estamos aprendiendo</h2></div><BookOpen size={19}/></div><div className="lesson-list">{[
              {title: 'Script vs. agente', detail: 'Reglas explícitas frente a decisiones contextualizadas', icon: Code2},
              {title: 'Orquestación', detail: 'Ejecuciones observables y mecanismos de recuperación', icon: GitBranch},
              {title: 'Human-in-the-loop', detail: 'Acciones potencialmente riesgosas necesitan aprobación', icon: ShieldCheck},
            ].map(item => <div className="lesson-row" key={item.title}><div className="lesson-icon"><item.icon size={18}/></div><div><b>{item.title}</b><span>{item.detail}</span></div><Check size={15} className="lesson-check"/></div>)}</div><button className="text-link" onClick={() => onNavigate('learning')}>Explorar la guía docente <ArrowRight size={15}/></button></section>
          </div>
        </>}
        {view === 'cicd' && <section className="panel spacious cicd-panel">
          <div className="section-heading"><span className="eyebrow">GIT · GITHUB ACTIONS · CLOUDFLARE</span><h2>Demostración CI/CD en vivo</h2><p>Esta pantalla identifica el build que realmente está publicado. Los controles de CI se verifican en GitHub Actions; aquí no simulamos su resultado.</p></div>
          <div className="cicd-meta">
            <div><small>VERSIÓN</small><b>{buildInfo.version}</b></div>
            <div><small>COMMIT</small><b className="mono">{buildInfo.commit}</b></div>
            <div><small>RAMA</small><b className="mono">{buildInfo.branch}</b></div>
            <div><small>PLATAFORMA</small><b>{buildInfo.platform}</b></div>
          </div>
          <div className="cicd-steps">
            {[
              ['01', 'Editar en VS Code', 'Cambiar un texto en React y verificarlo en localhost:5173.'],
              ['02', 'Crear rama + git push', 'Subir demo/cambio-en-vivo sin modificar producción.'],
              ['03', 'GitHub Actions (CI)', 'Ver los checks Python / pytest, React / build y Guardian / quality gate.'],
              ['04', 'Cloudflare Preview', 'Visitar la URL de preview asociada a la rama o Pull Request.'],
              ['05', 'Merge a main (CD)', 'Fusionar solo con CI verde y verificar el commit publicado aquí.'],
            ].map(([num, title, detail]) => <div className="cicd-step" key={num}><span>{num}</span><div><b>{title}</b><p>{detail}</p></div></div>)}
          </div>
          <div className="hint"><ShieldCheck size={18}/><span>El frontend público utiliza simulaciones: FastAPI y Ollama permanecen en tu equipo. Un build de Cloudflare no acredita que el backend local esté conectado.</span></div>
        </section>}
        {view === 'architecture' && <Architecture/>}
        {view === 'learning' && <Learning onNavigate={onNavigate}/>}
        {view === 'history' && <div className="panel spacious"><div className="section-heading"><span className="eyebrow">AUDITORÍA</span><h2>Últimas ejecuciones</h2><p>Las ejecuciones reales quedan persistidas en SQLite. En demo solo se conserva la sesión actual.</p></div><div className="history-list">{(source === 'demo' ? (run ? [{ ...run, created_at: new Date().toISOString() }] : []) : history).map(item => <div className="history-row" key={item.run_id}><div><b>{scenarios.find(s => s.id === item.scenario)?.name ?? item.scenario}</b><small>{modeLabels[item.mode]} · {new Date(item.created_at).toLocaleString('es-AR')}</small></div><StatusTag status={item.status}/></div>)}{(source === 'demo' ? !run : history.length === 0) && <div className="history-empty"><Clock3 size={27}/><p>No hay ejecuciones. Abrí el laboratorio para realizar la primera.</p><button className="text-link" onClick={() => onNavigate('laboratory')}>Ir al laboratorio <ArrowRight size={15}/></button></div>}</div></div>}
        <footer className="footer"><span><span className="footer-dot"/> AI DataOps Guardian · Material docente</span><span>Python + React + Ollama · v0.1.0</span></footer>
      </main>
    </div>
  </div>
}
