"""Dataset sintético de churn, controlado con semilla para clase reproducible."""
from __future__ import annotations
import numpy as np
import pandas as pd

FEATURES = ['tenure_months', 'monthly_spend', 'support_tickets', 'login_days']
ALIASES = {'monthly_expense': 'monthly_spend'}


def sample(n: int = 250, seed: int = 12, incident: str = 'normal') -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    tenure = rng.integers(1, 60, n)
    monthly = rng.normal(75, 21, n).clip(12, 180)
    tickets = rng.poisson(2.2, n)
    login = rng.integers(1, 28, n)
    noise = rng.normal(0, .6, n)
    risk = -1.2 - .035 * tenure + .020 * monthly + .27 * tickets - .085 * login + noise
    prob = 1 / (1 + np.exp(-risk))
    churn = rng.binomial(1, prob)
    df = pd.DataFrame({
        'customer_id': [f'C{i:05d}' for i in range(n)],
        'tenure_months': tenure,
        'monthly_spend': monthly.round(2),
        'support_tickets': tickets,
        'login_days': login,
        'churn': churn,
    })
    if incident == 'schema_change':
        df = df.rename(columns={'monthly_spend': 'monthly_expense'})
    elif incident == 'null_values':
        positions = rng.choice(n, size=max(1, n // 5), replace=False)
        df.loc[positions, 'monthly_spend'] = np.nan
    elif incident == 'duplicates':
        df = pd.concat([df, df.iloc[:30]], ignore_index=True)
    elif incident == 'drift':
        df['monthly_spend'] = (df['monthly_spend'] + 75).round(2)
        df['login_days'] = (df['login_days'] - 15).clip(lower=0)
    return df


def profile(df: pd.DataFrame) -> dict:
    """La herramienta del agente recibe estadísticas, no registros identificables."""
    return {
        'rows': int(len(df)),
        'columns': list(df.columns),
        'nulls': {str(k): int(v) for k, v in df.isna().sum().items()},
        'duplicate_customer_ids': int(df['customer_id'].duplicated().sum()) if 'customer_id' in df else None,
        'numerics': {str(k): round(float(v), 2) for k, v in df.select_dtypes(include='number').mean().dropna().items()},
    }
