import React, { useState, useRef } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
} from '@ionic/react';
import { cameraOutline, refreshOutline, checkmarkOutline } from 'ionicons/icons';
import { applyWatermark, WatermarkOptions, WatermarkResult } from '../../services/watermarker';
import './CameraWatermarkModal.css';

interface Props {
  isOpen: boolean;
  options: WatermarkOptions;
  onClose: () => void;
  onPhotoReady: (result: WatermarkResult) => void;
}

export const CameraWatermarkModal: React.FC<Props> = ({
  isOpen,
  options,
  onClose,
  onPhotoReady,
}) => {
  const [previewResult, setPreviewResult] = useState<WatermarkResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 / 스마트폰 카메라 촬영 완료 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // 원본 비율을 유지하고 긴 변을 최대 1280px로 줄여 WebP 변환
      const result = await applyWatermark(file, options);
      setPreviewResult(result);
    } catch (err) {
      console.error('이미지 WebP 변환 실패:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (previewResult) {
      onPhotoReady(previewResult);
      handleClose();
    }
  };

  const handleClose = () => {
    setPreviewResult(null);
    onClose();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>현장 사진 촬영</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>취소</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding camera-modal-content">
        {/* 숨겨진 파일 인풋 (스마트폰 카메라/PC 파일 선택) */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {!previewResult ? (
          <div className="camera-start-container">
            <div className="camera-icon-wrapper">
              <IonIcon icon={cameraOutline} style={{ fontSize: '64px', color: '#3880ff' }} />
            </div>
            <h2>현장 시설 사진 촬영</h2>
            <p className="camera-desc">
              촬영된 사진은 <strong>자르지 않고 긴 변 최대 1280px, WebP 품질 70</strong>으로 용량을 줄여 저장됩니다.
            </p>

            <div className="location-info-box">
              <div className="info-item">
                📍 <strong>적용 주소:</strong> {options.address}
              </div>
              <div className="info-item">
                🌐 <strong>적용 좌표:</strong> {options.latitude.toFixed(6)}, {options.longitude.toFixed(6)}
              </div>
            </div>

            <IonButton
              expand="block"
              size="large"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
            >
              {isProcessing ? '이미지 처리 중...' : '카메라 열기 / 사진 선택'}
            </IonButton>
          </div>
        ) : (
          <div className="camera-preview-container">
            <h3>사진 미리보기</h3>
            <p className="preview-subtext">사진 전체를 유지하며 긴 변 최대 1280px의 WebP 이미지로 변환되었습니다.</p>

            <div className="preview-image-box">
              <img src={previewResult.dataUrl} alt="WebP 최적화 미리보기" />
            </div>

            <div className="preview-actions">
              <IonButton
                fill="outline"
                color="medium"
                onClick={() => {
                  setPreviewResult(null);
                  fileInputRef.current?.click();
                }}
              >
                <IonIcon slot="start" icon={refreshOutline} />
                다시 촬영
              </IonButton>

              <IonButton color="success" onClick={handleConfirm}>
                <IonIcon slot="start" icon={checkmarkOutline} />
                이 사진 사용
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

