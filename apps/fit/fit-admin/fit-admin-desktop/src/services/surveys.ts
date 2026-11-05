import { supabase } from '../lib/supabase';
import { imageApi } from './imageApi';

async function stillReferenced(key: string): Promise<boolean> {
  for (const [table, column] of [['survey_locations', 'stamped_photo_path'], ['equipment_catalog', 'default_image_path'], ['exercise_sites', 'site_image_path']] as const) {
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase.from(table).select(column).range(offset, offset + 999);
      if (error) throw error;
      if ((data ?? []).some(row => (row as Record<string, unknown>)[column] === key)) return true;
      if ((data ?? []).length < 1000) break;
    }
  }
  return false;
}

export interface SurveyLocation { id: string; facility_name?: string; address?: string; stamped_photo_path?: string; review_note?: string; latitude: number; longitude: number; status: 'pending' | 'approved' | 'rejected'; created_at: string }

export async function updateSurveyPhoto(id: string, file: File): Promise<{ path: string; cleanupWarning?: string }> {
  const { data: previous, error: readError } = await supabase.from('survey_locations').select('stamped_photo_path').eq('id', id).single();
  if (readError) throw new Error('기존 대표 사진 정보를 확인하지 못했습니다.');
  const path = (await imageApi.upload('site-overview', file)).key;
  let update = supabase.from('survey_locations').update({ stamped_photo_path: path }).eq('id', id);
  update = previous.stamped_photo_path === null ? update.is('stamped_photo_path', null) : update.eq('stamped_photo_path', previous.stamped_photo_path);
  const { error } = await update.select('id').single();
  if (error) throw new Error('조사 데이터 사진 경로 업데이트에 실패했습니다.');
  let cleanupWarning: string | undefined;
  if (previous.stamped_photo_path && !/^https?:\/\//i.test(previous.stamped_photo_path)) {
    try { if (!await stillReferenced(previous.stamped_photo_path)) await imageApi.remove(previous.stamped_photo_path); } catch (reason) { cleanupWarning = `사진은 저장되었지만 기존 파일을 정리하지 못했습니다. ${reason instanceof Error ? reason.message : ''}`; }
  }
  return { path, cleanupWarning };
}

export async function listSurveyLocations(status: 'all' | 'pending' | 'approved' = 'pending') {
  let query = supabase.from('survey_locations').select('*');
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error('조사 수집 목록을 불러오지 못했습니다.');
  return (data as SurveyLocation[]) || [];
}

export async function approveSurveyToSite(survey: SurveyLocation) {
  const { data, error } = await supabase.rpc('admin_approve_survey_to_site', { p_survey_id: survey.id });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') throw new Error('승인 기능의 DB 업데이트가 필요합니다.');
    throw new Error(`지점 승인에 실패했습니다: ${error.message}`);
  }
  if (!data) throw new Error('지점 승인 결과를 확인하지 못했습니다.');
  return data;
}
