import { expect, test, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createProfileRepository, createSiteRepository } from '@map-apps/data';

function repository(responses: { body: unknown; status?: number; wait?: Promise<void> }[]) {
  const requests: URL[] = [];
  const client = createClient('https://fixture.supabase.co', 'fixture-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input) => {
      requests.push(new URL(String(input)));
      const response = responses.shift();
      if (!response) throw new Error('예상하지 않은 추가 요청');
      await response.wait;
      return new Response(JSON.stringify(response.body), {
        status: response.status ?? 200, headers: { 'Content-Type': 'application/json' },
      });
    } },
  });
  return { sites: createSiteRepository(client, { imageApiBaseUrl: 'https://images.fixture.test' }), requests };
}

const site = { id: 'site-1', name: '시설', latitude: '37.5', longitude: '127.0' };

test('지도 조회는 공개 조건·좌표 범위와 501개 상한을 서버에 전달한다', async () => {
  const { sites, requests } = repository([{ body: [site] }]);
  const result = await sites.getPublishedSitesInBounds({ west: 126, south: 37, east: 128, north: 38 });
  expect(result.sites).toHaveLength(1); expect(result.tooMany).toBe(false);
  expect(requests[0].searchParams.getAll('longitude')).toEqual(['gte.126', 'lte.128']);
  expect(requests[0].searchParams.getAll('latitude')).toEqual(['gte.37', 'lte.38']);
  expect(requests[0].searchParams.get('is_published')).toBe('eq.true');
  expect(requests[0].searchParams.get('limit')).toBe('501');
});

test('과밀 범위의 일부 지점을 전체 목록으로 반환하지 않는다', async () => {
  const { sites } = repository([{ body: Array.from({ length: 501 }, (_, index) => ({ ...site, id: String(index) })) }]);
  expect(await sites.getPublishedSitesInBounds({ west: 126, south: 37, east: 128, north: 38 })).toEqual({ sites: [], tooMany: true });
});

test('뒤집히거나 잘못된 지도 범위는 요청 전에 거부한다', async () => {
  const { sites, requests } = repository([]);
  await expect(sites.getPublishedSitesInBounds({ west: 128, south: 37, east: 126, north: 38 })).rejects.toThrow('지도 범위');
  expect(requests).toHaveLength(0);
});

test('공개 목록의 숫자 문자열 좌표를 변환하고 공개 필터를 유지한다', async () => {
  const { sites, requests } = repository([{ body: [site] }]);
  expect(await sites.getPublishedSites()).toEqual([{ ...site, latitude: 37.5, longitude: 127 }]);
  expect(requests[0].searchParams.get('is_published')).toBe('eq.true');
});

test.each([null, '', 'NaN', 91])('유효하지 않은 위도를 정상 시설로 취급하지 않는다: %s', async latitude => {
  const { sites } = repository([{ body: [{ ...site, latitude }] }]);
  await expect(sites.getPublishedSites()).rejects.toThrow('좌표');
});

test('빈 목록과 조회 실패를 구분한다', async () => {
  expect(await repository([{ body: [] }]).sites.getPublishedSites()).toEqual([]);
  await expect(repository([{ body: { message: 'denied' }, status: 403 }]).sites.getPublishedSites()).rejects.toThrow();
});

test('시설 사진 경로와 배열 형태의 카탈로그를 변환한다', async () => {
  const { sites } = repository([
    { body: { ...site, site_image_path: 'old/photo.jpg', toilet_status: 'invalid' } },
    { body: 'site/photo.jpg' },
    { body: [{ id: 'installation-1', quantity: 2, display_order: 1, equipment_id: 'equipment-1',
      equipment_catalog: [{ name: '허리 돌리기', model_name: 'A', default_image_path: 'equipment/photo.webp' }] }] },
  ]);
  const result = await sites.getSiteDetail('site-1');
  expect(result?.site_image_path).toBe('https://images.fixture.test/v1/public/sites/site-1/image');
  expect(result?.toilet_status).toBe('unknown');
  expect(result?.equipments[0]).toMatchObject({ installationId: 'installation-1', name: '허리 돌리기', quantity: 2,
    default_image_path: 'https://images.fixture.test/v1/public/installations/installation-1/image' });
});

test('설치 기구 조회 실패를 빈 기구 목록으로 숨기지 않는다', async () => {
  const { sites } = repository([{ body: site }, { body: null }, { body: { message: 'denied' }, status: 403 }]);
  await expect(sites.getSiteDetail('site-1')).rejects.toThrow('설치 기구');
});

test('존재하지 않는 시설은 null을 반환한다', async () => {
  expect(await repository([{ body: null }]).sites.getSiteDetail('missing')).toBeNull();
});

test.each([false, undefined])('부모 시설이 공개 상태가 아니면 기구를 반환하지 않는다: %s', async is_published => {
  const { sites } = repository([{ body: { id: 'i', site_id: 's', exercise_sites: { is_published } } }]);
  expect(await sites.getEquipmentDetail('s', 'i')).toBeNull();
});

test('공개 시설의 기구 상세에서 객체 카탈로그와 기본 설명을 처리한다', async () => {
  const { sites, requests } = repository([{ body: { id: 'i', site_id: 's', quantity: 0,
    exercise_sites: [{ name: '시설', is_published: true }],
    equipment_catalog: { name: '기구', default_image_path: 'equipment/key.webp' } } }]);
  expect(await sites.getEquipmentDetail('s', 'i')).toMatchObject({
    siteName: '시설', equipmentName: '기구', quantity: 1, instructions: '등록된 운동 방법이 없습니다.',
    default_image_path: 'https://images.fixture.test/v1/public/installations/i/image',
  });
  expect(requests[0].searchParams.get('site_id')).toBe('eq.s');
  expect(requests[0].searchParams.get('is_published')).toBe('eq.true');
});

test('저장 어댑터가 분리되며 저장 실패는 호출자에게 전달된다', async () => {
  const first = createProfileRepository({ get: async () => null, set: async () => { throw new Error('저장 실패'); } });
  const second = createProfileRepository({ get: async () => '{"region":"서울"}', set: async () => {} });
  expect((await first.getUserProfile()).region).toBe('');
  expect((await second.getUserProfile()).region).toBe('서울');
  await expect(first.saveUserProfile({ birthYear: null, gender: 'NONE', region: '', useCurrentLocation: false }))
    .rejects.toThrow('저장 실패');
});


test('사진 RPC 오류는 오래된 사진으로 숨기지 않는다', async () => {
  const { sites } = repository([{ body: site }, { body: { message: 'denied' }, status: 403 }]);
  await expect(sites.getSiteDetail('site-1')).rejects.toThrow();
});

test.each([{}, [], 42, ''])('잘못된 사진 응답은 거부한다: %s', async photo => {
  const { sites } = repository([{ body: site }, { body: photo }]);
  await expect(sites.getSiteDetail('site-1')).rejects.toThrow();
});

test('사진이 없는 공개 지점은 사진 없이 반환한다', async () => {
  const { sites, requests } = repository([{ body: site }, { body: null }, { body: [] }]);
  expect((await sites.getSiteDetail('site-1'))?.site_image_path).toBeNull();
  expect(requests[1].pathname).toBe('/rest/v1/rpc/get_published_site_photo');
  expect(requests[1].searchParams.get('p_site_id')).toBe('site-1');
  expect(requests.some(url => url.pathname.includes('survey_locations'))).toBe(false);
});

test('설치 기구 응답이 지연되어도 사진 RPC를 먼저 시작한다', async () => {
  let release = () => {};
  const wait = new Promise<void>(resolve => { release = resolve; });
  const { sites, requests } = repository([
    { body: site }, { body: 'site-overviews/photo.webp' }, { body: [], wait },
  ]);
  const pending = sites.getSiteDetail('site-1');
  try {
    await vi.waitFor(() => expect(requests.some(url => url.pathname.includes('/rpc/'))).toBe(true));
  } finally { release(); }
  expect((await pending)?.site_image_path).toBe('https://images.fixture.test/v1/public/sites/site-1/image');
});

