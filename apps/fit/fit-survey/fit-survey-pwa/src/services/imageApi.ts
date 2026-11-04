import { createImageApi } from '@map-apps/image-api';
import { supabase } from './supabase';

export const imageApi = createImageApi({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  async getAccessToken() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error('이미지 인증 세션을 확인하지 못했습니다.');
    return data.session?.access_token ?? null;
  },
});
