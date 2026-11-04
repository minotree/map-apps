// src/services/watermarker.ts

export interface WatermarkOptions {
  address: string;
  latitude: number;
  longitude: number;
}

export interface WatermarkResult {
  dataUrl: string; // webp base64 이미지
  blob: Blob;      // 서버 업로드용 Blob 객체
  timestamp: string;
}

/**
 * 원본 비율을 유지하고 긴 변을 최대 1280px로 줄여 WebP 품질 70으로 압축합니다.
 */
export async function applyWatermark(
  imageFile: File | string,
  _options: WatermarkOptions
): Promise<WatermarkResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timestamp = new Date().toISOString();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      // 사진 전체를 비율에 맞춰 축소하며 작은 사진은 확대하지 않습니다.
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // WebP 형식으로 압축 변환 (품질 70)
      const dataUrl = canvas.toDataURL('image/webp', 0.7);

      // Base64를 서버 저장용 Blob으로 변환
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              dataUrl,
              blob,
              timestamp,
            });
          } else {
            reject(new Error('WebP Blob 변환에 실패했습니다.'));
          }
        },
        'image/webp',
        0.7
      );
    };

    img.onerror = (err) => reject(err);

    if (typeof imageFile === 'string') {
      img.src = imageFile;
    } else {
      img.src = URL.createObjectURL(imageFile);
    }
  });
}

