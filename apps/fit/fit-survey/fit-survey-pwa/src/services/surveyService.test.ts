import { beforeEach, expect, test, vi } from 'vitest';
import { getTodaySurveys, saveSurvey } from './surveyService';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), order: vi.fn(), insert: vi.fn(), saved: vi.fn(),
  upload: vi.fn(), getPublicUrl: vi.fn(), eq: vi.fn(),
}));
vi.mock('./supabase', () => ({
  supabase: {
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({ eq: mocks.eq }),
      insert: mocks.insert,
    }),
    storage: { from: () => ({ upload: mocks.upload, getPublicUrl: mocks.getPublicUrl }) },
  },
}));
const survey = { facility_name: '테스트 시설', latitude: 37, longitude: 127, address: '서울' };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null });
  mocks.eq.mockReturnValue({ gte: () => ({ order: mocks.order }) });
  mocks.insert.mockReturnValue({ select: mocks.saved });
  mocks.saved.mockResolvedValue({ data: [{ ...survey, id: 'survey-id', stamped_photo_path: 'photo.webp' }], error: null });
  mocks.upload.mockImplementation(async (path: string) => ({ data: { path }, error: null }));
  mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.webp' } });
});

test('조회 실패를 빈 목록으로 숨기지 않는다', async () => {
  const error = new Error('connection failed');
  mocks.order.mockResolvedValue({ data: null, error });
  await expect(getTodaySurveys()).rejects.toBe(error);
});

test('본인 조사만 조회하고 정상적인 빈 목록을 반환한다', async () => {
  mocks.order.mockResolvedValue({ data: [], error: null });
  await expect(getTodaySurveys()).resolves.toEqual([]);
  expect(mocks.eq).toHaveBeenCalledWith('created_by', 'user-a');
});

test('인증 실패 시 사진과 DB에 쓰지 않는다', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error('expired') });
  await expect(saveSurvey(survey, new Blob(['photo']))).rejects.toThrow('로그인');
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.insert).not.toHaveBeenCalled();
});

test('본인 소유 pending 조사와 사진 경로를 저장하고 공개 URL을 반환한다', async () => {
  const result = await saveSurvey(survey, new Blob(['photo']));
  expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(/^representative\/user-a\/.+\.webp$/), expect.any(Blob), expect.objectContaining({ upsert: false }));
  expect(mocks.insert).toHaveBeenCalledWith([expect.objectContaining({ created_by: 'user-a', status: 'pending', linked_site_id: null, stamped_photo_path: expect.any(String) })]);
  expect(result.photo_url).toBe('https://example.com/photo.webp');
});

test('DB 실패 후 동일 사진 재시도는 업로드를 재사용한다', async () => {
  const photo = new Blob(['photo']);
  mocks.saved.mockResolvedValueOnce({ data: null, error: { message: 'temporary failure' } });
  await expect(saveSurvey(survey, photo)).rejects.toThrow('temporary failure');
  await saveSurvey(survey, photo);
  expect(mocks.upload).toHaveBeenCalledTimes(1);
  expect(mocks.insert).toHaveBeenCalledTimes(2);
});

test('사진 업로드 실패 시 DB에 쓰지 않고 재시도 시 새 업로드를 한다', async () => {
  const photo = new Blob(['photo']);
  mocks.upload.mockResolvedValueOnce({ data: null, error: { message: 'upload failed' } });
  await expect(saveSurvey(survey, photo)).rejects.toThrow('upload failed');
  expect(mocks.insert).not.toHaveBeenCalled();
  await saveSurvey(survey, photo);
  expect(mocks.upload).toHaveBeenCalledTimes(2);
});

test('계정이 바뀌면 이전 사용자의 업로드를 재사용하지 않는다', async () => {
  const photo = new Blob(['photo']);
  mocks.saved.mockResolvedValueOnce({ data: null, error: { message: 'failed' } });
  await expect(saveSurvey(survey, photo)).rejects.toThrow();
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-b' } }, error: null });
  await saveSurvey(survey, photo);
  expect(mocks.upload).toHaveBeenCalledTimes(2);
});

test('사진 없는 조사도 등록한다', async () => {
  await saveSurvey(survey);
  expect(mocks.upload).not.toHaveBeenCalled();
  expect(mocks.insert).toHaveBeenCalledWith([expect.objectContaining({ stamped_photo_path: null })]);
});

