import { SurveyData, SurveyLocationRow } from '../types/survey';
import { supabase } from './supabase';

const TABLE_NAME = 'survey_locations';
const STORAGE_BUCKET = 'survey-photos';
// Retain completed uploads for retries of the same form, separately per user.
const uploadedPhotos = new WeakMap<Blob, Map<string, string>>();

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('로그인이 필요합니다. 다시 로그인해 주세요.');
  }
  return data.user.id;
}

export async function uploadSurveyPhoto(photoBlob: Blob, path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, photoBlob, {
    contentType: 'image/webp',
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error(`현장 사진 업로드에 실패했습니다: ${error.message}`);
  return data.path;
}

function toSurveyData(row: SurveyLocationRow): SurveyData {
  return {
    id: row.id,
    facility_name: row.facility_name,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    address: row.address,
    memo: row.review_note,
    photo_url: row.stamped_photo_path
      ? supabase.storage.from(STORAGE_BUCKET).getPublicUrl(row.stamped_photo_path).data.publicUrl
      : undefined,
    created_at: row.created_at,
  };
}

export async function saveSurvey(
  survey: Omit<SurveyData, 'id' | 'created_at'>,
  stampedPhotoBlob?: Blob
): Promise<SurveyData> {
  const userId = await requireUserId();
  let photoPath: string | null = null;
  if (stampedPhotoBlob) {
    const paths = uploadedPhotos.get(stampedPhotoBlob) ?? new Map<string, string>();
    photoPath = paths.get(userId) ?? null;
    if (!photoPath) {
      const fileName = `representative/${userId}/${crypto.randomUUID()}.webp`;
      photoPath = await uploadSurveyPhoto(stampedPhotoBlob, fileName);
      paths.set(userId, photoPath);
      uploadedPhotos.set(stampedPhotoBlob, paths);
    }
  }
  const row: SurveyLocationRow = {
    facility_name: survey.facility_name,
    latitude: survey.latitude,
    longitude: survey.longitude,
    accuracy: survey.accuracy,
    address: survey.address,
    stamped_photo_path: photoPath,
    review_note: survey.memo,
    taken_at: new Date().toISOString(),
    created_by: userId,
    status: 'pending',
    linked_site_id: null,
  };
  const { data, error } = await supabase.from(TABLE_NAME).insert([row]).select();
  // Ordinary users cannot delete objects. Preserve the uploaded path for retry.
  if (error) throw new Error(`조사 저장에 실패했습니다: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error('저장 결과를 확인하지 못했습니다. 목록을 확인한 후 재시도해 주세요.');
  }
  if (stampedPhotoBlob) uploadedPhotos.get(stampedPhotoBlob)?.delete(userId);
  return toSurveyData(data[0]);
}

export async function getTodaySurveys(): Promise<SurveyData[]> {
  const userId = await requireUserId();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from(TABLE_NAME)
    .select('*')
    .eq('created_by', userId)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toSurveyData);
}

export const getSurveys = getTodaySurveys;

