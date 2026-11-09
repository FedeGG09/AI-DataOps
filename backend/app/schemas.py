"""Contratos API. Pydantic valida entradas antes de ejecutar herramientas."""
from typing import Literal
from pydantic import BaseModel, Field

Scenario = Literal['normal', 'schema_change', 'null_values', 'api_failure', 'drift', 'duplicates']
Mode = Literal['script', 'pipeline', 'agent']

class RunRequest(BaseModel):
    scenario: Scenario = 'normal'
    mode: Mode = 'script'
    use_llm: bool = True
    approve_action: bool = False
    max_steps: int = Field(default=3, ge=1, le=6)

class ToolEvent(BaseModel):
    name: str
    detail: str
    status: Literal['ok', 'warning', 'error', 'info'] = 'info'

class RunResponse(BaseModel):
    run_id: str
    mode: Mode
    scenario: Scenario
    status: Literal['success', 'warning', 'error', 'needs_approval']
    summary: str
    events: list[ToolEvent]
    metrics: dict[str, float | int | None]
    proposal: dict | None = None
    llm_status: str = 'not_requested'
    agent_trace: list[dict] = Field(default_factory=list)
