import React, { useState, useEffect } from 'react';
import { IonContent, IonButton, IonImg } from '@ionic/react';
import { stampImage } from '../utils/imageOverlay';

interface PhotoPreviewProps {
  file: File;
  latitude: number;
  longitude: number;
  address: string;
  takenAt: Date;
  onRetake: () => void;
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ file, latitude, longitude, address, takenAt, onRetake }) => {
  const [stampedFile, setStampedFile] = useState<Blob | null>(null);

  useEffect(() => {
    const stamp = async () => {
      const stamped = await stampImage(file, latitude, longitude, address, takenAt);
      setStampedFile(stamped);
    };
    stamp();
  }, [file, latitude, longitude, address, takenAt]);

  return (
    <IonContent>
      {stampedFile ? (
        <IonImg src={URL.createObjectURL(stampedFile)} alt="Stamped" style={{ width: '100%', height: 'auto', marginTop: '10px' }} />
      ) : (
        <IonImg src="/default-image.png" alt="Default" style={{ width: '100%', height: 'auto', marginTop: '10px' }} />
      )}
      <IonButton expand="block" onClick={onRetake} style={{ marginTop: '10px' }}>
        재촬영
      </IonButton>
    </IonContent>
  );
};

export default PhotoPreview;

