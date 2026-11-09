"""Tres modos de ejecución: script rígido, pipeline resiliente y herramientas seguras.

La lógica de negocio nunca delega decisiones de seguridad al LLM.
"""
from __future__ import annotations
from dataclasses import dataclass, field
import pandas as pd
import time
from .data import FEATURES, ALIASES, sample, profile
from .model import get_model, drift_report

SCENARIOS = [
    {'id': 'normal', 'name': 'Operación normal', 'description': 'Datos limpios; control del experimento', 'concept': 'Reproducibilidad'},
    {'id': 'schema_change', 'name': 'Cambio de esquema', 'description': 'monthly_spend cambia de nombre inesperadamente', 'concept': 'Adaptabilidad'},
    {'id': 'null_values', 'name': 'Valores faltantes', 'description': 'El 20% de gastos mensuales pasa a NaN', 'concept': 'Calidad de datos'},
    {'id': 'api_failure', 'name': 'API intermitente', 'description': 'Una API falla dos veces antes de responder', 'concept': 'Retries y backoff'},
    {'id': 'drift', 'name': 'Data Drift', 'description': 'La distribución de gasto y actividad cambia', 'concept': 'MLOps / PSI'},
    {'id': 'duplicates', 'name': 'IDs duplicados', 'description': 'Se duplican treinta clientes', 'concept': 'Validaciones y deduplicación'},
]

@dataclass
class Result:
    status: str = 'success'
    summary: str = ''
    events: list[dict] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)
    df: pd.DataFrame | None = None

    def event(self, name: str, detail: str, status: str = 'info'):
        self.events.append({'name': name, 'detail': detail, 'status': status})


def initial_dataframe(scenario: str) -> pd.DataFrame:
    return sample(250, seed=12, incident=scenario)


def script_run(scenario: str) -> Result:
    """Anti-patrón intencional: sin manejo de fallos ni controles de calidad."""
    result = Result()
    try:
        result.event('Carga de datos', 'Lectura directa de una fuente sin reintentos', 'ok')
        if scenario == 'api_failure':
            raise ConnectionError('HTTP 503: servicio de origen temporalmente no disponible')
        df = initial_dataframe(scenario)
        result.df = df
        result.event('Transformación', 'Se seleccionan columnas fijas (sin validación)', 'info')
        if df[FEATURES].isna().any().any():
            raise ValueError('El script no dispone de una política de tratamiento de nulos')
        predictions = get_model().predict(df[FEATURES])
        result.metrics = {'rows': len(df), 'predicted_churn': int(predictions.sum())}
        result.event('Inferencia', 'Predicciones generadas', 'ok')
        result.summary = 'El script terminó. No comprueba calidad de datos ni cambios estadísticos.'
    except Exception as ex:
        result.status = 'error'
        result.summary = f'{type(ex).__name__}: {ex}'
        result.event('Ejecución interrumpida', result.summary, 'error')
    return result


def pipeline_run(scenario: str, corrected_df: pd.DataFrame | None = None) -> Result:
    """Workflow visible. Las tareas son explícitas, con fallos y reglas deterministas."""
    r = Result()
    if scenario == 'api_failure':
        for i in range(1, 4):
            if i < 3:
                r.event('Extracción de API', f'Intento {i}/3: HTTP 503. Backoff didáctico: {0.1 * (2 ** (i-1)):.1f}s.', 'warning')
                time.sleep(0.1 * (2 ** (i-1)))
            else:
                r.event('Extracción de API', 'Intento 3/3: HTTP 200. Fuente recuperada.', 'ok')
    df = corrected_df.copy() if corrected_df is not None else initial_dataframe(scenario)
    r.df = df
    r.event('Carga de datos', f'{len(df)} filas recibidas', 'ok')
    missing = [name for name in FEATURES if name not in df.columns]
    if missing:
        r.status = 'error'
        r.summary = f'Validación de esquema fallida: faltan {missing}. No se entrenará ni inferirá.'
        r.event('Validación de esquema', r.summary, 'error')
        return r
    r.event('Validación de esquema', 'Columnas requeridas presentes', 'ok')
    nulls = int(df[FEATURES].isna().sum().sum())
    duplicates = int(df['customer_id'].duplicated().sum())
    if nulls or duplicates:
        r.status = 'error'
        r.summary = f'Validación de calidad fallida: {nulls} nulos, {duplicates} IDs duplicados.'
        r.metrics = {'nulls': nulls, 'duplicates': duplicates, 'rows': len(df)}
        r.event('Control de calidad', r.summary, 'error')
        return r
    r.event('Control de calidad', 'Sin valores faltantes ni IDs duplicados', 'ok')
    predictions = get_model().predict(df[FEATURES])
    r.metrics = {'rows': len(df), 'predicted_churn': int(predictions.sum()), 'nulls': 0, 'duplicates': 0}
    r.event('Inferencia del modelo', 'Scikit-learn ejecutó el modelo baseline', 'ok')
    psi_by_feature = drift_report(df)
    top_psi = max(psi_by_feature.values(), default=0.0)
    r.metrics['max_psi'] = round(top_psi, 3)
    r.metrics['psi_monthly_spend'] = psi_by_feature.get('monthly_spend')
    if top_psi >= .25:
        r.status = 'warning'
        r.event('Monitoreo de Data Drift', f'PSI máximo = {top_psi:.3f} ≥ 0.25. Revisar datos y modelo.', 'warning')
        r.summary = 'Pipeline finalizado con alerta de data drift. No significa necesariamente model drift.'
    else:
        r.event('Monitoreo de Data Drift', f'PSI máximo = {top_psi:.3f}; dentro del umbral didáctico.', 'ok')
        r.summary = 'Pipeline finalizado y validado.'
    return r


def suggested_action(scenario: str) -> dict:
    """Catálogo auditable: un LLM no puede inventar acciones ejecutables."""
    actions = {
        'schema_change': ('rename_column', 'Renombrar monthly_expense a monthly_spend y revalidar', True),
        'null_values': ('impute_median', 'Imputar faltantes de monthly_spend con la mediana y revalidar', True),
        'duplicates': ('deduplicate', 'Conservar el primer registro por customer_id y revalidar', True),
        'drift': ('review_drift', 'Analizar segmentos y considerar un modelo challenger con etiquetas verificadas', False),
        'api_failure': ('monitor_api', 'Mantener retries acotados y alertas sobre errores sostenidos', False),
        'normal': ('no_action', 'El sistema funciona normalmente; no se requiere intervención', False),
    }
    action_id, rationale, actionable = actions[scenario]
    return {'action_id': action_id, 'description': rationale, 'requires_approval': actionable, 'can_execute': actionable}


def apply_safe_action(df: pd.DataFrame, action_id: str) -> pd.DataFrame:
    """Únicas mutaciones aprobables, sin shell, SQL libre ni escritura arbitraria."""
    copy = df.copy()
    if action_id == 'rename_column' and 'monthly_expense' in copy:
        return copy.rename(columns={'monthly_expense': 'monthly_spend'})
    if action_id == 'impute_median' and 'monthly_spend' in copy:
        return copy.assign(monthly_spend=copy['monthly_spend'].fillna(copy['monthly_spend'].median()))
    if action_id == 'deduplicate' and 'customer_id' in copy:
        return copy.drop_duplicates('customer_id', keep='first').reset_index(drop=True)
    raise ValueError('Acción no reconocida o incompatible con los datos')
