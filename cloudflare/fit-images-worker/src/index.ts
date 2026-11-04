export interface Env {
  IMAGES: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  ALLOWED_ORIGINS: string;
  MAX_IMAGE_BYTES?: string;
  IMAGE_SIGNING_SECRET: string;
}

type ImageKind = 'site-overview' | 'equipment';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OBJECT_KEY = /^(site-overviews|equipment)\/[0-9a-f-]{36}\.webp$/i;

function json(value: unknown, status = 200, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set('content-type', 'application/json; charset=utf-8');
  responseHeaders.set('x-content-type-options', 'nosniff');
  return new Response(JSON.stringify(value), { status, headers: responseHeaders });
}

function allowedOrigins(env: Env): Set<string> {
  return new Set(env.ALLOWED_ORIGINS.split(',').map(value => value.trim()).filter(Boolean));
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({ vary: 'origin' });
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins(env).has(origin)) {
    headers.set('access-control-allow-origin', origin);
    headers.set('access-control-allow-methods', 'GET,POST,DELETE,OPTIONS');
    headers.set('access-control-allow-headers', 'authorization,content-type');
    headers.set('access-control-max-age', '86400');
  }
  return headers;
}

function withCors(response: Response, request: Request, env: Env): Response {
  const headers = new Headers(response.headers);
  corsHeaders(request, env).forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function bearer(request: Request): string | null {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() || null : null;
}

async function requireAdmin(request: Request, env: Env): Promise<Response | null> {
  const token = bearer(request);
  if (!token) return json({ error: 'authentication_required' }, 401);
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/rpc/admin_is_owner`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: '{}',
  });
  if (!response.ok) return json({ error: 'authentication_failed' }, 401);
  return await response.json<boolean>() === true ? null : json({ error: 'administrator_required' }, 403);
}

function maxImageBytes(env: Env): number {
  const parsed = Number(env.MAX_IMAGE_BYTES || 10 * 1024 * 1024);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 10 * 1024 * 1024;
}

function validKey(value: string | null): value is string {
  return value !== null && OBJECT_KEY.test(value) && !value.includes('..');
}

function base64url(bytes: ArrayBuffer): string {
  let value = '';
  for (const byte of new Uint8Array(bytes)) value += String.fromCharCode(byte);
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signature(secret: string, key: string, expires: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${key}\n${expires}`)));
}

async function privateImageUrl(request: Request, env: Env): Promise<Response> {
  const key = new URL(request.url).searchParams.get('key');
  if (!validKey(key)) return json({ error: 'invalid_object_key' }, 400);
  if (!env.IMAGE_SIGNING_SECRET) return json({ error: 'signing_not_configured' }, 503);
  const expires = String(Math.floor(Date.now() / 1000) + 300);
  const token = await signature(env.IMAGE_SIGNING_SECRET, key, expires);
  const url = new URL('/v1/private/image', request.url);
  url.searchParams.set('key', key);
  url.searchParams.set('expires', expires);
  url.searchParams.set('token', token);
  return json({ url: url.toString(), expiresAt: Number(expires) * 1000 }, 200, { 'cache-control': 'no-store' });
}

async function privateImage(request: Request, env: Env): Promise<Response> {
  if (!env.IMAGE_SIGNING_SECRET) return json({ error: 'signing_not_configured' }, 503);
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  const expires = url.searchParams.get('expires');
  const token = url.searchParams.get('token');
  if (!validKey(key) || !expires || !token || !/^\d+$/.test(expires)) return json({ error: 'invalid_signature' }, 403);
  const expiresAt = Number(expires);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < now || expiresAt > now + 600) {
    return json({ error: 'expired_signature' }, 403);
  }
  const expected = await signature(env.IMAGE_SIGNING_SECRET, key, expires);
  if (token.length !== expected.length) return json({ error: 'invalid_signature' }, 403);
  let mismatch = 0;
  for (let index = 0; index < token.length; index += 1) mismatch |= token.charCodeAt(index) ^ expected.charCodeAt(index);
  if (mismatch !== 0) return json({ error: 'invalid_signature' }, 403);
  const object = await env.IMAGES.get(key);
  return object ? imageResponse(object, 'private') : json({ error: 'not_found' }, 404);
}

function imageResponse(object: R2ObjectBody, visibility: 'private' | 'public'): Response {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('content-type', object.httpMetadata?.contentType || 'image/webp');
  headers.set('etag', object.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('cache-control', visibility === 'public' ? 'public, max-age=3600' : 'private, no-store');
  return new Response(object.body, { headers });
}

async function upload(request: Request, env: Env): Promise<Response> {
  const kind = new URL(request.url).searchParams.get('kind') as ImageKind | null;
  if (kind !== 'site-overview' && kind !== 'equipment') return json({ error: 'invalid_image_kind' }, 400);
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'image/webp') {
    return json({ error: 'webp_required' }, 415);
  }
  const declared = Number(request.headers.get('content-length') || 0);
  const maximum = maxImageBytes(env);
  if (declared > maximum) return json({ error: 'image_too_large', maximumBytes: maximum }, 413);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength === 0) return json({ error: 'empty_image' }, 400);
  if (bytes.byteLength > maximum) return json({ error: 'image_too_large', maximumBytes: maximum }, 413);
  const prefix = kind === 'site-overview' ? 'site-overviews' : 'equipment';
  const key = `${prefix}/${crypto.randomUUID()}.webp`;
  const stored = await env.IMAGES.put(key, bytes, {
    httpMetadata: { contentType: 'image/webp', cacheControl: 'private, no-store' },
    customMetadata: { kind },
    onlyIf: { etagDoesNotMatch: '*' },
  });
  if (!stored) return json({ error: 'object_conflict' }, 409);
  return json({ key, size: bytes.byteLength }, 201, { 'cache-control': 'no-store' });
}

async function adminImages(request: Request, env: Env): Promise<Response> {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  if (request.method === 'POST') return upload(request, env);
  const key = new URL(request.url).searchParams.get('key');
  if (!validKey(key)) return json({ error: 'invalid_object_key' }, 400);
  if (request.method === 'GET') {
    const object = await env.IMAGES.get(key);
    return object ? imageResponse(object, 'private') : json({ error: 'not_found' }, 404);
  }
  if (request.method === 'DELETE') {
    await env.IMAGES.delete(key);
    return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
  }
  return json({ error: 'method_not_allowed' }, 405, { allow: 'GET,POST,DELETE' });
}

async function supabaseJson(env: Env, path: string): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}${path}`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY },
  });
  if (!response.ok) return { ok: false, status: response.status };
  return { ok: true, value: await response.json() };
}

async function publicSite(siteId: string, env: Env): Promise<Response> {
  if (!UUID.test(siteId)) return json({ error: 'invalid_site_id' }, 400);
  const result = await supabaseJson(env, `/rest/v1/rpc/get_published_site_photo?p_site_id=${encodeURIComponent(siteId)}`);
  if (!result.ok) return json({ error: 'site_lookup_failed' }, 502);
  const key = typeof result.value === 'string' ? result.value : null;
  if (!validKey(key)) return json({ error: 'not_found' }, 404);
  const object = await env.IMAGES.get(key);
  return object ? imageResponse(object, 'public') : json({ error: 'not_found' }, 404);
}

interface InstallationRow {
  equipment_catalog?: { default_image_path?: string | null } | { default_image_path?: string | null }[] | null;
  exercise_sites?: { is_published?: boolean } | { is_published?: boolean }[] | null;
}

async function publicInstallation(installationId: string, env: Env): Promise<Response> {
  if (!UUID.test(installationId)) return json({ error: 'invalid_installation_id' }, 400);
  const select = 'equipment_catalog(default_image_path),exercise_sites(is_published)';
  const path = `/rest/v1/site_equipment?id=eq.${encodeURIComponent(installationId)}&is_published=eq.true&select=${encodeURIComponent(select)}&limit=1`;
  const result = await supabaseJson(env, path);
  if (!result.ok) return json({ error: 'installation_lookup_failed' }, 502);
  const row = Array.isArray(result.value) ? result.value[0] as InstallationRow | undefined : undefined;
  const site = Array.isArray(row?.exercise_sites) ? row.exercise_sites[0] : row?.exercise_sites;
  const catalog = row?.equipment_catalog;
  const catalogRow = Array.isArray(catalog) ? catalog[0] : catalog;
  const key = catalogRow?.default_image_path || null;
  if (site?.is_published !== true || !validKey(key)) return json({ error: 'not_found' }, 404);
  const object = await env.IMAGES.get(key);
  return object ? imageResponse(object, 'public') : json({ error: 'not_found' }, 404);
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('origin');
    return origin && allowedOrigins(env).has(origin)
      ? new Response(null, { status: 204, headers: corsHeaders(request, env) })
      : json({ error: 'origin_not_allowed' }, 403);
  }
  if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true });
  if (url.pathname === '/v1/admin/images') return adminImages(request, env);
  if (url.pathname === '/v1/admin/image-url' && request.method === 'GET') {
    const denied = await requireAdmin(request, env);
    return denied || privateImageUrl(request, env);
  }
  if (url.pathname === '/v1/private/image' && request.method === 'GET') return privateImage(request, env);
  const site = url.pathname.match(/^\/v1\/public\/sites\/([^/]+)\/image$/);
  if (site && request.method === 'GET') return publicSite(site[1], env);
  const installation = url.pathname.match(/^\/v1\/public\/installations\/([^/]+)\/image$/);
  if (installation && request.method === 'GET') return publicInstallation(installation[1], env);
  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return withCors(await handle(request, env), request, env);
    } catch {
      return withCors(json({ error: 'internal_error' }, 500), request, env);
    }
  },
} satisfies ExportedHandler<Env>;

