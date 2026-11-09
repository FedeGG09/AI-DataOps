/**
 * Cloudflare Pages Function: intermediario SAME-ORIGIN de /api/*.
 *
 * Este archivo corre en Cloudflare, NO en el navegador. Por eso puede usar
 * Secrets de Cloudflare Access sin incorporarlos al bundle de React.
 * El usuario aún debe ingresar su clave personal/de laboratorio en React.
 *
 * GUARDIAN_API_ORIGIN             = https://api.tudominio.com (URL sin path)
 * GUARDIAN_ACCESS_CLIENT_ID       = Access service token ID (SECRETO)
 * GUARDIAN_ACCESS_CLIENT_SECRET   = Access service token secret (SECRETO)
 * GUARDIAN_ALLOW_UNPROTECTED_ORIGIN = 1 SOLO para Quick Tunnel de prueba.
 */
const ALLOWED = new Map([
  ['/api/health', 'GET'],
  ['/api/ollama', 'GET'],
  ['/api/scenarios', 'GET'],
  ['/api/dashboard', 'GET'],
  ['/api/run', 'POST'],
]);

function error(status, message) {
  return Response.json({ detail: message }, {
    status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export async function onRequest({ request, env }) {
  const incoming = new URL(request.url);
  if (!ALLOWED.has(incoming.pathname)) return error(404, 'Ruta de API no permitida');
  if (request.method !== ALLOWED.get(incoming.pathname)) return error(405, 'Método no permitido');
  if (incoming.search) return error(400, 'No se admiten parámetros de consulta en esta API');

  const key = request.headers.get('X-Guardian-Key') || '';
  if (key.length < 32 || key.length > 256) {
    return error(401, 'Ingresá la clave del laboratorio en el modo LIVE');
  }
  let body;
  if (request.method === 'POST') {
    const type = request.headers.get('Content-Type') || '';
    if (!type.startsWith('application/json')) return error(415, 'Sólo se acepta JSON');
    // Límite REAL sobre el stream, aunque el cliente no mande Content-Length.
    const reader = request.body?.getReader();
    const chunks = [];
    let total = 0;
    if (!reader) return error(400, 'Falta el cuerpo JSON');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 20000) {
        await reader.cancel();
        return error(413, 'Solicitud demasiado grande');
      }
      chunks.push(value);
    }
    body = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    try { JSON.parse(new TextDecoder().decode(body)); }
    catch { return error(400, 'JSON inválido'); }
  }

  if (!env.GUARDIAN_API_ORIGIN) {
    return error(503, 'Backend remoto no configurado: falta GUARDIAN_API_ORIGIN en Pages');
  }
  let origin;
  try {
    origin = new URL(env.GUARDIAN_API_ORIGIN);
    if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
      return error(503, 'GUARDIAN_API_ORIGIN debe ser una URL https:// sin ruta ni parámetros');
    }
    // No permitir destinos privados como error accidental de configuración.
    if (/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(origin.hostname)) {
      return error(503, 'No se puede enviar tráfico de Pages directamente a un servidor privado');
    }
  } catch {
    return error(503, 'GUARDIAN_API_ORIGIN contiene una URL inválida');
  }
  const id = env.GUARDIAN_ACCESS_CLIENT_ID || '';
  const secret = env.GUARDIAN_ACCESS_CLIENT_SECRET || '';
  if (Boolean(id) !== Boolean(secret)) {
    return error(503, 'Configuración incompleta de Cloudflare Access: faltan credenciales');
  }
  if (!id && env.GUARDIAN_ALLOW_UNPROTECTED_ORIGIN !== '1') {
    return error(503, 'Por seguridad, configurá Access o habilitá explícitamente Quick Tunnel de pruebas');
  }
  if (!id && !origin.hostname.endsWith('.trycloudflare.com')) {
    return error(503, 'Sin Access, sólo se admite un Quick Tunnel *.trycloudflare.com para pruebas');
  }

  const headers = new Headers({
    'X-Guardian-Key': key,
    'Accept': 'application/json',
  });
  if (request.method === 'POST') headers.set('Content-Type', 'application/json');
  if (id && secret) {
    headers.set('CF-Access-Client-Id', id);
    headers.set('CF-Access-Client-Secret', secret);
  }
  const target = new URL(incoming.pathname, origin);
  try {
    // Nunca reenviar Cookies, Authorization, Host u otros headers del navegador.
    const response = await fetch(target.toString(), {
      method: request.method,
      headers,
      body: request.method === 'POST' ? body : undefined,
      redirect: 'manual',
      signal: AbortSignal.timeout(110000),
    });
    if (response.status >= 300 && response.status < 400) {
      return error(502, 'Cloudflare Access rechazó el acceso o intentó redirigir');
    }
    const type = response.headers.get('Content-Type') || '';
    if (!type.toLowerCase().includes('application/json')) {
      return error(502, 'El backend respondió con contenido no JSON; verificá el túnel/Access');
    }
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json; charset=utf-8',
                 'Cache-Control': 'no-store',
                 'X-Content-Type-Options': 'nosniff' },
    });
  } catch {
    return error(502, 'No se puede alcanzar el backend: comprobar PC, FastAPI, túnel y Access');
  }
}
