"""Servicio de aplicación: vincula pipelines, agente y aprobación humana."""
from __future__ import annotations
from uuid import uuid4
from .schemas import RunRequest
from .engine import script_run, pipeline_run, initial_dataframe, suggested_action, apply_safe_action
from .agent import diagnose
from .storage import save_run


def execute(request: RunRequest) -> dict:
    """Toda ejecución produce un ID y se audita en SQLite, incluso si falla."""
    llm_status = 'not_requested'
    proposal = None
    trace = []
    if request.mode == 'script':
        result = script_run(request.scenario)
    elif request.mode == 'pipeline':
        result = pipeline_run(request.scenario)
    else:
        result = pipeline_run(request.scenario)
        proposal = suggested_action(request.scenario)
        result.event('Diagnóstico inicial', 'El agente observa el resultado de un pipeline con controles.', 'info')
        if request.use_llm:
            narrative, trace, llm_status = diagnose(
                request.scenario, result.summary, result.df, request.max_steps
            )
            result.event('Agente / Ollama', narrative[:1400], 'ok' if llm_status == 'connected' else 'warning')
        else:
            llm_status = 'disabled'
            result.event('Modo sin LLM', 'Propuesta obtenida de un catálogo de reglas; NO es una inferencia del modelo.', 'warning')
        if proposal['can_execute'] and not request.approve_action:
            result.status = 'needs_approval'
            result.summary = 'Se detectó una posible corrección. Requiere aprobación humana para aplicarla.'
            result.event('Human-in-the-loop', 'Acción en espera; no se modificaron datos.', 'warning')
        elif proposal['can_execute'] and request.approve_action:
            try:
                fixed = apply_safe_action(initial_dataframe(request.scenario), proposal['action_id'])
                verified = pipeline_run(request.scenario, corrected_df=fixed)
                verified.events = result.events + [
                    {'name': 'Aprobación humana', 'detail': f"Acción aprobada: {proposal['action_id']}", 'status': 'ok'}
                ] + verified.events
                verified.summary = f"Corrección validada. {verified.summary}"
                result = verified
            except (ValueError, KeyError) as ex:
                result.status = 'error'
                result.summary = f'No se pudo aplicar la acción: {ex}'
                result.event('Corrección', result.summary, 'error')
    payload = {
        'run_id': uuid4().hex[:12], 'mode': request.mode, 'scenario': request.scenario,
        'status': result.status, 'summary': result.summary, 'events': result.events,
        'metrics': result.metrics, 'proposal': proposal,
        'llm_status': llm_status, 'agent_trace': trace,
    }
    save_run(payload)
    return payload
