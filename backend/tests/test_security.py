"""Pruebas de seguridad: backend inaccesible sin credenciales correctas."""
import backend.app.main as module
from fastapi.testclient import TestClient


def test_fail_closed_no_key(monkeypatch):
    monkeypatch.setattr(module, 'API_KEY', '')
    client = TestClient(module.app)
    assert client.get('/api/health').status_code == 503


def test_authentication(monkeypatch):
    key = 't' * 48
    monkeypatch.setattr(module, 'API_KEY', key)
    client = TestClient(module.app)
    assert client.get('/api/health').status_code == 401
    assert client.get('/api/health', headers={'X-Guardian-Key': 'bad'}).status_code == 401
    ok = client.get('/api/health', headers={'X-Guardian-Key': key})
    assert ok.status_code == 200
    assert ok.headers['cache-control'] == 'no-store'


def test_read_only_method_enforced(monkeypatch):
    monkeypatch.setattr(module, 'API_KEY', 's' * 48)
    client = TestClient(module.app)
    assert client.delete('/api/dashboard', headers={'X-Guardian-Key': 's' * 48}).status_code == 405
