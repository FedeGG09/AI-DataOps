"""Orquestación Prefect 3 (opcional): ejemplo real de flow y tasks para la clase.

Instalación: pip install -r backend/requirements-mlops.txt
Uso: python -m backend.app.prefect_workflow
El frontend funciona sin Prefect: el pipeline en engine.py es independiente.
"""
from .engine import initial_dataframe, pipeline_run


def main():
    try:
        from prefect import flow, task, get_run_logger
    except ImportError as ex:
        raise SystemExit('Falta Prefect: pip install -r backend/requirements-mlops.txt') from ex

    @task(name='extraer-datos', retries=2, retry_delay_seconds=1)
    def extract(scenario: str):
        return initial_dataframe(scenario)

    @task(name='validar-esquema')
    def check_schema(df):
        from .data import FEATURES
        missing = sorted(set(FEATURES) - set(df.columns))
        if missing:
            raise ValueError(f'Columnas faltantes: {missing}')
        return df

    @task(name='validar-calidad')
    def check_quality(df):
        from .data import FEATURES
        if int(df[FEATURES].isna().sum().sum()) or int(df['customer_id'].duplicated().sum()):
            raise ValueError('Falló el control de calidad de datos')
        return df

    @task(name='inferir-y-monitorear')
    def inference(df, scenario: str):
        result = pipeline_run(scenario, corrected_df=df)
        get_run_logger().info('Resultado: %s | Métricas: %s', result.status, result.metrics)
        return result.status

    @flow(name='guardian-churn-flow', log_prints=True)
    def guardian_flow(scenario: str = 'normal'):
        extracted = extract(scenario)
        checked = check_schema(extracted)
        clean = check_quality(checked)
        return inference(clean, scenario)

    print('Estado final:', guardian_flow('normal'))

if __name__ == '__main__':
    main()
