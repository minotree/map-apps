import React, { useState } from 'react';
import { IonButton, IonContent } from '@ionic/react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const src = URL.createObjectURL(file);
      setImageSrc(src);
      onCapture(file);
    }
  };

  const handleCancel = () => {
    setImageSrc(null);
  };

  return (
    <IonContent>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />
      <IonButton expand="block" onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement).click()}>
        카메라 촬영
      </IonButton>
      {imageSrc && (
        <div>
          <img src={imageSrc} alt="Captured" style={{ width: '100%', height: 'auto', marginTop: '10px' }} />
          <IonButton expand="block" onClick={handleCancel} style={{ marginTop: '10px' }}>
            촬영 취소
          </IonButton>
        </div>
      )}
    </IonContent>
  );
};

export default CameraCapture;

