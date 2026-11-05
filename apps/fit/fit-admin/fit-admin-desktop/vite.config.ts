import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5176,
    strictPort: true,
    // Tauri와 로컬 Python 이미지 런타임 생성물은 프런트엔드 변경 감시에서 제외한다.
    watch: {
      ignored: ['**/src-tauri/**', '**/.venv-images/**', '**/image-service/.models/**'],
    },
  },
  preview: { 
    host: "127.0.0.1", 
    port: 5176, 
    strictPort: true 
  },
});
