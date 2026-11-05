export type ImageKind = 'site-overview' | 'equipment';

export interface ImageApiOptions {
  baseUrl: string;
  getAccessToken: () => Promise<string | null>;
  fetch?: typeof globalThis.fetch;
}

export interface UploadedImage {
  key: string;
  size: number;
}

export function createImageApi(options: ImageApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const request = options.fetch ?? globalThis.fetch;
  const root = '/v1/admin';

  async function token(): Promise<string> {
    const value = await options.getAccessToken();
    if (!value) throw new Error('이미지 작업을 위한 로그인이 필요합니다.');
    return value;
  }

  async function authorized(path: string, init: RequestInit = {}): Promise<Response> {
    if (!baseUrl) throw new Error('이미지 API 주소가 설정되지 않았습니다.');
    const headers = new Headers(init.headers);
    headers.set('authorization', `Bearer ${await token()}`);
    return request(`${baseUrl}${path}`, { ...init, headers });
  }

  return {
    async upload(kind: ImageKind, image: Blob): Promise<UploadedImage> {
      const response = await authorized(`${root}/images?kind=${encodeURIComponent(kind)}`, {
        method: 'POST', body: image, headers: { 'content-type': 'image/webp' },
      });
      if (!response.ok) throw new Error(`이미지 업로드에 실패했습니다. (${response.status})`);
      const value = await response.json() as UploadedImage;
      if (!value.key || !Number.isFinite(value.size)) throw new Error('이미지 업로드 응답이 올바르지 않습니다.');
      return value;
    },

    async privateUrl(key: string): Promise<string> {
      const response = await authorized(`${root}/image-url?key=${encodeURIComponent(key)}`);
      if (!response.ok) throw new Error(`이미지 URL 발급에 실패했습니다. (${response.status})`);
      const value = await response.json() as { url?: unknown };
      if (typeof value.url !== 'string' || !value.url) throw new Error('이미지 URL 응답이 올바르지 않습니다.');
      return value.url;
    },

    async remove(key: string): Promise<void> {
      const response = await authorized(`${root}/images?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`이미지 삭제에 실패했습니다. (${response.status})`);
    },

    async list(): Promise<string[]> {
      const response = await authorized('/v1/admin/image-keys');
      if (!response.ok) throw new Error(`이미지 목록 조회에 실패했습니다. (${response.status})`);
      const value = await response.json() as { keys?: unknown };
      if (!Array.isArray(value.keys) || !value.keys.every(key => typeof key === 'string')) {
        throw new Error('이미지 목록 응답이 올바르지 않습니다.');
      }
      return value.keys;
    },
  };
}

