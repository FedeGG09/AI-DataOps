import test from 'node:test'
import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import { onRequest } from '../functions/api/[[path]].js'

// Worker usa crypto.subtle. Node 22 también, con fallback solo para tests.
if (!globalThis.crypto?.subtle) globalThis.crypto = webcrypto
const key = 'X'.repeat(48)
const origin = 'https://clase.trycloudflare.com'
const env = { GUARDIAN_API_KEY: key, GUARDIAN_API_ORIGIN: origin, GUARDIAN_ALLOW_UNPROTECTED_ORIGIN: '1' }
const req = (path='/api/health', method='GET', secret=key, body) => new Request('https://clase.pages.dev'+path, {
  method, headers: { ...(secret ? {'X-Guardian-Key': secret} : {}), ...(body ? {'Content-Type':'application/json'} : {}) }, body,
})

test('no acepta ruta desconocida ni metodo incorrecto', async () => {
  assert.equal((await onRequest({ request:req('/api/admin'), env })).status, 404)
  assert.equal((await onRequest({ request:req('/api/run'), env })).status, 405)
})
test('sin secreto en Pages devuelve 503 y no reenvia', async () => {
  assert.equal((await onRequest({ request:req(), env:{...env, GUARDIAN_API_KEY:''} })).status, 503)
})
test('sin clave de usuario devuelve 401', async () => {
  assert.equal((await onRequest({ request:req('/api/health','GET',''), env })).status, 401)
})
test('clave distinta devuelve 401 y no consulta origen', async () => {
  const original = globalThis.fetch
  let called = false
  globalThis.fetch = async()=>{called=true;throw new Error('never')}
  try {
    const r = await onRequest({ request:req('/api/health','GET','B'.repeat(48)), env })
    assert.equal(r.status,401)
    assert.equal(called,false)
  } finally {globalThis.fetch=original}
})
test('clave correcta reenvia unicamente encabezado permitido', async () => {
  const original=globalThis.fetch
  let forwarded
  try {
    globalThis.fetch=async(url,opts)=>{forwarded={url,opts};return Response.json({status:'ok',service:'backend-local',version:'0.3.0'})}
    const r=await onRequest({request:req(),env})
    assert.equal(r.status,200)
    assert.equal(forwarded.url,origin+'/api/health')
    assert.equal(forwarded.opts.headers.get('X-Guardian-Key'),key)
    assert.equal(forwarded.opts.headers.get('Cookie'),null)
    assert.equal((await r.json()).service,'backend-local')
  } finally {globalThis.fetch=original}
})
test('no permite configuracion insegura ni dominios privados', async () => {
  let r=await onRequest({request:req(),env:{...env,GUARDIAN_API_ORIGIN:'http://127.0.0.1:8000'}})
  assert.equal(r.status,503)
  r=await onRequest({request:req(),env:{...env,GUARDIAN_API_ORIGIN:'https://otro.example.com'}})
  assert.equal(r.status,503)
  r=await onRequest({request:req(),env:{...env,GUARDIAN_ALLOW_UNPROTECTED_ORIGIN:''}})
  assert.equal(r.status,503)
})
test('rechaza JSON superior a 20 KB', async () => {
  const r=await onRequest({request:req('/api/run','POST',key,JSON.stringify({large:'x'.repeat(20050)})),env})
  assert.equal(r.status,413)
})
test('no admite queries ni metodos inesperados', async()=>{
  const r=await onRequest({request:req('/api/health?token=a'),env})
  assert.equal(r.status,400)
})
