"""Modelo ML pequeño: entrenamiento reproducible, artefactos y PSI para drift."""
from __future__ import annotations
import json
import numpy as np
from pathlib import Path
from joblib import dump, load
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, roc_auc_score
from sklearn.model_selection import train_test_split
from .config import DATA_DIR
from .data import FEATURES, sample

MODEL_PATH = DATA_DIR / 'churn_model.joblib'
REFERENCE_PATH = DATA_DIR / 'reference.json'


def train_model(track_mlflow: bool = False) -> dict:
    df = sample(1200, seed=100)
    x_train, x_test, y_train, y_test = train_test_split(
        df[FEATURES], df['churn'], test_size=.25, random_state=42, stratify=df['churn']
    )
    pipe = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(max_iter=500, random_state=42)),
    ])
    pipe.fit(x_train, y_train)
    pred = pipe.predict(x_test)
    p = pipe.predict_proba(x_test)[:, 1]
    metrics = {'accuracy': round(float(accuracy_score(y_test, pred)), 4),
               'roc_auc': round(float(roc_auc_score(y_test, p)), 4)}
    dump(pipe, MODEL_PATH)
    reference = {feature: df[feature].astype(float).tolist() for feature in FEATURES}
    REFERENCE_PATH.write_text(json.dumps(reference), encoding='utf-8')
    if track_mlflow:
        # MLflow opcional: el laboratorio básico no requiere levantar su servidor.
        try:
            import mlflow
        except ImportError as ex:
            raise RuntimeError('Instalá backend/requirements-mlops.txt para usar MLflow') from ex
        from .config import ROOT
        mlflow.set_tracking_uri((ROOT / 'backend' / 'data' / 'mlruns').as_uri())
        mlflow.set_experiment('Guardian-Churn')
        with mlflow.start_run(run_name='baseline-logreg'):
            mlflow.log_params({'model': 'LogisticRegression', 'seed': 42, 'train_rows': len(x_train)})
            mlflow.log_metrics(metrics)
            mlflow.log_artifact(str(MODEL_PATH))
    return metrics


def get_model():
    if not MODEL_PATH.exists() or not REFERENCE_PATH.exists():
        train_model()
    return load(MODEL_PATH)


def psi(reference: list[float], observed: list[float], bins: int = 10) -> float:
    """Population Stability Index con bins basados en cuantiles del conjunto base."""
    base = np.asarray(reference, dtype=float)
    current = np.asarray(observed, dtype=float)
    base = base[np.isfinite(base)]
    current = current[np.isfinite(current)]
    if not len(base) or not len(current):
        return 0.0
    cuts = np.unique(np.quantile(base, np.linspace(0, 1, bins + 1)))
    if len(cuts) < 2:
        return 0.0
    # -inf y +inf evitan perder valores cuando el drift excede el rango inicial.
    edges = np.concatenate(([-np.inf], cuts[1:-1], [np.inf]))
    a = np.histogram(base, bins=edges)[0].astype(float)
    b = np.histogram(current, bins=edges)[0].astype(float)
    a = np.maximum(a / a.sum(), 1e-6)
    b = np.maximum(b / b.sum(), 1e-6)
    return float(np.sum((b - a) * np.log(b / a)))


def drift_report(df) -> dict[str, float]:
    if not REFERENCE_PATH.exists():
        get_model()
    reference = json.loads(REFERENCE_PATH.read_text(encoding='utf-8'))
    return {name: round(psi(reference[name], df[name].dropna().tolist()), 3)
            for name in FEATURES if name in df.columns}
