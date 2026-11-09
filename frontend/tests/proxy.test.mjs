/** Verificaciones de protección y proxy sin red ni credenciales reales. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequest } from '../functions/api/[[path]].js'
const origin = 'https://api.example.com'
const url = 'https://demo.pages.dev/api/health'
const key = 's'.repeat(48)
const request = (p = '/api/health', method = 'GET', headers = {}) => new Request('https://demo.pages.dev' + p, { method, headers })

test('deny unknown route and method', async () => {
  assert.equal((await onRequest({ request: request('/api/shell'), env: {} })).status, 404)
  assert.equal((await onRequest({ request: request('/api/run'), env: {} })).status, 405)
})
test('deny absent key', async () => {
  assert.equal((await onRequest({ request: request(), env: { GUARDIAN_API_ORIGIN: origin } })).status, 401)
})
test('deny origin without Access by default', async () => {
  const r = await onRequest({ request: request('/api/health', 'GET', { 'X-Guardian-Key': key }), env: { GUARDIAN_API_ORIGIN: origin } })
  assert.equal(r.status, 503)
})
test('deny invalid origin and incomplete Access', async () => {
  const h = { 'X-Guardian-Key': key }
  const bad = await onRequest({request:request('/api/health','GET',h), env:{GUARDIAN_API_ORIGIN:'http://127.0.0.1:8000',GUARDIAN_ACCESS_CLIENT_ID:'id',GUARDIAN_ACCESS_CLIENT_SECRET:'secret'}})
  assert.equal(bad.status, 503)
  const missing = await onRequest({request:request('/api/health','GET',h), env:{GUARDIAN_API_ORIGIN:origin,GUARDIAN_ACCESS_CLIENT_ID:'id'}})
  assert.equal(missing.status, 503)
})
test('service secret is injected only at the edge', async () => {
  const before = globalThis.fetch
  let forwarded
  try {
    globalThis.fetch = async (u,opts) => {
      forwarded = { url: u, opts }
      return Response.json({ status: 'ok' })
    }
    const r = await onRequest({request:request('/api/health','GET',{'X-Guardian-Key':key}),env:{GUARDIAN_API_ORIGIN:origin,GUARDIAN_ACCESS_CLIENT_ID:'id-test',GUARDIAN_ACCESS_CLIENT_SECRET:'secret-test'}})
    assert.equal(r.status,200)
    assert.equal(forwarded.url,origin+'/api/health')
    assert.equal(forwarded.opts.headers.get('CF-Access-Client-Secret'),'secret-test')
    assert.equal(forwarded.opts.headers.get('X-Guardian-Key'),key)
    assert.equal(r.headers.get('Cache-Control'),'no-store')
  } finally { globalThis.fetch = before }
})
test('quick tunnels work only with explicit opt-in', async () => {
  const before = globalThis.fetch
  try {
    globalThis.fetch = async () => Response.json({ status: 'ok' })
    const r = await onRequest({request:request('/api/health','GET',{'X-Guardian-Key':key}),env:{GUARDIAN_API_ORIGIN:'https://short.trycloudflare.com', GUARDIAN_ALLOW_UNPROTECTED_ORIGIN:'1'}})
    assert.equal(r.status,200)
  } finally { globalThis.fetch = before }
})

test('reject oversized POST JSON without forwarding', async () => {
  const r = await onRequest({
    request: new Request('https://demo.pages.dev/api/run', { method:'POST', headers:{ 'X-Guardian-Key':key, 'Content-Type':'application/json' }, body: JSON.stringify({ blob:'x'.repeat(21000) }) }),
    env:{GUARDIAN_API_ORIGIN:origin,GUARDIAN_ACCESS_CLIENT_ID:'id',GUARDIAN_ACCESS_CLIENT_SECRET:'secret'},
  })
  assert.equal(r.status,413)
})
