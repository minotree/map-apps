import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { resolvePrivateImageUrl } from '../services/imageApi';

interface PrivateImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  imageKey: string;
}

export function PrivateImage({ imageKey, ...props }: PrivateImageProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setUrl(null);
    void resolvePrivateImageUrl(imageKey).then(value => {
      if (active) setUrl(value);
    }).catch(error => console.warn('이미지 URL 발급 실패:', error));
    return () => { active = false; };
  }, [imageKey]);

  return url ? <img src={url} {...props} /> : null;
}
