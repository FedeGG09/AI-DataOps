"""Memoria persistente y auditoría SQLite: nunca almacenamos secretos ni prompts completos."""
import json
import sqlite3
from datetime import datetime, timezone
from .config import DATA_DIR

DB = DATA_DIR / 'guardian.sqlite3'

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA journal_mode=WAL')
    db.execute('CREATE TABLE IF NOT EXISTS runs (run_id TEXT PRIMARY KEY, created_at TEXT, scenario TEXT, mode TEXT, status TEXT, summary TEXT, metrics TEXT, events TEXT)')
    db.commit()
    return db


def save_run(run: dict):
    with connect() as db:
        db.execute('INSERT INTO runs VALUES (?,?,?,?,?,?,?,?)', (
            run['run_id'], datetime.now(timezone.utc).isoformat(), run['scenario'],
            run['mode'], run['status'], run['summary'],
            json.dumps(run['metrics']), json.dumps(run['events']),
        ))
        db.commit()


def recent(limit: int = 20) -> list[dict]:
    with connect() as db:
        rows = db.execute('SELECT run_id, created_at, scenario, mode, status, summary, metrics FROM runs ORDER BY created_at DESC LIMIT ?', (min(limit, 100),)).fetchall()
        return [{**dict(row), 'metrics': json.loads(row['metrics'])} for row in rows]


def counts() -> dict:
    with connect() as db:
        total = db.execute('SELECT count(*) FROM runs').fetchone()[0]
        success = db.execute("SELECT count(*) FROM runs WHERE status IN ('success', 'warning')").fetchone()[0]
    return {'runs': total, 'resolved': success}
