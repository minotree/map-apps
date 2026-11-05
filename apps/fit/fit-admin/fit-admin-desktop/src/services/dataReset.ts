import { supabase } from '../lib/supabase';
import { createDataReset } from '../lib/dataReset';
import { checkAdminAccess } from './auth';
import { imageApi } from './imageApi';

let imageKeys: string[] | null = null;

export const dataReset = createDataReset({
  async verifyAdmin() {
    const result = await checkAdminAccess();
    if (!result.isAdmin) throw new Error(result.error || '관리자 권한이 필요합니다.');
  },
  async count(table) {
    const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true });
    if (error || count === null) throw new Error(`${table} 조회 실패: ${error?.message || '행 수를 확인할 수 없습니다.'}`);
    return count;
  },
  async list(bucket, prefix, offset) {
    if (prefix) return [];
    imageKeys ??= await imageApi.list();
    const objectPrefix = bucket === 'survey-photos' ? 'site-overviews/' : 'equipment/';
    return imageKeys.filter(key => key.startsWith(objectPrefix)).slice(offset, offset + 1000).map(name => ({ name, id: name }));
  },
  async remove(_bucket, paths) {
    await Promise.all(paths.map(path => imageApi.remove(path)));
    imageKeys = null;
  },
  async deleteRows(table) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null);
    if (error) throw new Error(`${table} 삭제 실패: ${error.message}`);
  },
});
