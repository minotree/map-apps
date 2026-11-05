import { supabase } from '../lib/supabase';
import type { EquipmentCatalog } from '../types/database';
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

export async function uploadEquipmentImage(file: File): Promise<string> {
  if (file.type !== 'image/webp') throw new Error('변환과 확인을 마친 WebP 이미지만 업로드할 수 있습니다.');
  return (await imageApi.upload('equipment', file)).key;
}

export async function listEquipmentCatalog(searchQuery = '') {
  let query = supabase.from('equipment_catalog').select('*');
  if (searchQuery.trim()) query = query.ilike('name', `%${searchQuery.trim()}%`);
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw new Error('운동기구 목록을 불러오지 못했습니다.');
  return (data as EquipmentCatalog[]) || [];
}

export async function createEquipmentCatalog(item: Partial<EquipmentCatalog>) {
  const { data, error } = await supabase.from('equipment_catalog').insert([{ ...item, default_image_path: item.default_image_path || null }]).select().single();
  if (error) throw new Error(`운동기구 등록 실패: ${error.message}`);
  return data as EquipmentCatalog;
}

export async function updateEquipmentCatalog(id: string, item: Partial<EquipmentCatalog>) {
  const { data: previous, error: readError } = await supabase.from('equipment_catalog').select('default_image_path').eq('id', id).single();
  if (readError) throw new Error('기존 운동기구 사진 정보를 확인하지 못했습니다.');
  let update = supabase.from('equipment_catalog').update({ ...item, updated_at: new Date().toISOString() }).eq('id', id);
  update = previous.default_image_path === null ? update.is('default_image_path', null) : update.eq('default_image_path', previous.default_image_path);
  const { data, error } = await update.select().single();
  if (error) throw new Error(`운동기구 수정 실패: ${error.message}`);
  let cleanupWarning: string | undefined;
  if (previous.default_image_path && previous.default_image_path !== data.default_image_path && !/^https?:\/\//i.test(previous.default_image_path)) {
    try { if (!await stillReferenced(previous.default_image_path)) await imageApi.remove(previous.default_image_path); } catch (reason) { cleanupWarning = `사진은 저장되었지만 기존 파일을 정리하지 못했습니다. ${reason instanceof Error ? reason.message : ''}`; }
  }
  return { ...data, cleanupWarning } as EquipmentCatalog & { cleanupWarning?: string };
}
