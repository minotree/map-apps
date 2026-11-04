import { describe, expect, it, vi } from 'vitest';
import { handle, type Env } from './index';

function env(overrides: Partial<Env> = {}): Env {
  return {
    IMAGES: { put: vi.fn(), get: vi.fn(), delete: vi.fn() } as unknown as R2Bucket,
    SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'fixture-key',
    ALLOWED_ORIGINS: 'http://127.0.0.1:5175',
    MAX_IMAGE_BYTES: '10',
    IMAGE_SIGNING_SECRET: 'fixture-signing-secret-at-least-32-bytes',
    ...overrides,
  };
}

describe('fit images worker', () => {
  it('reports health without exposing configuration', async () => {
    const response = await handle(new Request('https://worker.test/health'), env());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it('rejects unknown preflight origins', async () => {
    const response = await handle(new Request('https://worker.test/v1/admin/images', {
      method: 'OPTIONS', headers: { origin: 'https://evil.test' },
    }), env());
    expect(response.status).toBe(403);
  });

  it('requires an administrator token for uploads', async () => {
    const response = await handle(new Request('https://worker.test/v1/admin/images?kind=equipment', {
      method: 'POST', headers: { 'content-type': 'image/webp' }, body: new Uint8Array([1]),
    }), env());
    expect(response.status).toBe(401);
  });

  it('rejects invalid public identifiers before a database request', async () => {
    const response = await handle(new Request('https://worker.test/v1/public/sites/not-a-uuid/image'), env());
    expect(response.status).toBe(400);
  });

  it('stores an administrator WebP under a generated object key', async () => {
    const put = vi.fn().mockResolvedValue({});
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('true', {
      headers: { 'content-type': 'application/json' },
    })));
    try {
      const response = await handle(new Request('https://worker.test/v1/admin/images?kind=equipment', {
        method: 'POST',
        headers: { authorization: 'Bearer token', 'content-type': 'image/webp' },
        body: new Uint8Array([1, 2]),
      }), env({ IMAGES: { put } as unknown as R2Bucket }));
      expect(response.status).toBe(201);
      const result = await response.json<{ key: string }>();
      expect(result.key).toMatch(/^equipment\/[0-9a-f-]{36}\.webp$/);
      expect(put).toHaveBeenCalledWith(result.key, expect.any(ArrayBuffer), expect.objectContaining({
        httpMetadata: expect.objectContaining({ contentType: 'image/webp' }),
      }));
    } finally { vi.unstubAllGlobals(); }
  });

  it('streams a published site image after the database returns an object key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify('site-overviews/11111111-1111-4111-8111-111111111111.webp'), {
      headers: { 'content-type': 'application/json' },
    })));
    const object = {
      body: new Blob(['image']).stream(), httpEtag: '"etag"', httpMetadata: { contentType: 'image/webp' },
      writeHttpMetadata(headers: Headers) { headers.set('content-type', 'image/webp'); },
    } as unknown as R2ObjectBody;
    try {
      const response = await handle(new Request(
        'https://worker.test/v1/public/sites/11111111-1111-4111-8111-111111111111/image',
      ), env({ IMAGES: { get: vi.fn().mockResolvedValue(object) } as unknown as R2Bucket }));
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('public, max-age=3600');
      expect(await response.text()).toBe('image');
    } finally { vi.unstubAllGlobals(); }
  });
});
