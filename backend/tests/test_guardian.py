"""Pruebas automáticas: modos, incidentes, validaciones y permisos."""
from backend.app.engine import pipeline_run, script_run, initial_dataframe, apply_safe_action
from backend.app.model import psi
from backend.app.schemas import RunRequest
from backend.app.service import execute


def test_script_breaks_on_schema():
    assert script_run('schema_change').status == 'error'


def test_pipeline_detects_schema():
    assert pipeline_run('schema_change').status == 'error'


def test_retries_illustrated():
    output = pipeline_run('api_failure')
    assert output.status in ('success', 'warning')
    assert sum('Intento' in item['detail'] for item in output.events) == 3


def test_data_drift_detected():
    result = pipeline_run('drift')
    assert result.status == 'warning'
    assert result.metrics['max_psi'] >= .25


def test_human_approval_and_validation():
    r = execute(RunRequest(scenario='schema_change', mode='agent', use_llm=False))
    assert r['status'] == 'needs_approval'
    r2 = execute(RunRequest(scenario='schema_change', mode='agent', use_llm=False, approve_action=True))
    assert r2['status'] in ('success', 'warning')


def test_action_allowlist():
    import pytest
    with pytest.raises(ValueError):
        apply_safe_action(initial_dataframe('normal'), 'delete_all')


def test_psi_not_nan():
    assert psi([1, 2, 3, 4, 5]*10, [1, 2, 3, 4, 5]*10) < .001
