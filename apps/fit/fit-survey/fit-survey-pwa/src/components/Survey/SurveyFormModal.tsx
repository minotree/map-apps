import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonLoading,
  IonToast,
  IonIcon,
} from '@ionic/react';
import { cameraOutline, trashOutline } from 'ionicons/icons';
import { Coordinates, SurveyData } from '../../types/survey';
import { WatermarkResult } from '../../services/watermarker';
import { saveSurvey } from '../../services/surveyService';
import { CameraWatermarkModal } from '../Camera/CameraWatermarkModal';

interface SurveyFormModalProps {
  isOpen: boolean;
  centerCoords: Coordinates;
  address: string;
  initialPhoto?: WatermarkResult | null;
  onClose: () => void;
  onSurveySaved: (savedSurvey: SurveyData) => void;
}

export const SurveyFormModal: React.FC<SurveyFormModalProps> = ({
  isOpen,
  centerCoords,
  address,
  initialPhoto,
  onClose,
  onSurveySaved,
}) => {
  const [facilityName, setFacilityName] = useState('');
  const [customAddress, setCustomAddress] = useState(address);
  const [memo, setMemo] = useState('');
  const [photoResult, setPhotoResult] = useState<WatermarkResult | null>(initialPhoto || null);

  useEffect(() => {
    if (initialPhoto) {
      setPhotoResult(initialPhoto);
    }
  }, [initialPhoto]);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setCustomAddress(address);
  }, [address]);

  const handleOpenPhotoCapture = () => {
    setIsCameraOpen(true);
  };

  const handlePhotoReady = (result: WatermarkResult) => {
    setPhotoResult(result);
  };

  const handleRemovePhoto = () => {
    setPhotoResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityName.trim()) {
      setToastMessage('시설명을 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      const newSurvey = await saveSurvey(
        {
          facility_name: facilityName.trim(),
          latitude: centerCoords.latitude,
          longitude: centerCoords.longitude,
          address: customAddress.trim() || address,
          memo: memo.trim(),
        },
        photoResult ? photoResult.blob : undefined
      );

      setToastMessage('조사 데이터가 성공적으로 등록되었습니다.');
      onSurveySaved(newSurvey);
      resetForm();
      onClose();
    } catch (err) {
      console.error('조사 등록 실패:', err);
      setToastMessage(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFacilityName('');
    setMemo('');
    setPhotoResult(null);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>현장 시설조사 등록</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>닫기</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <form onSubmit={handleSubmit}>
            {/* 위치 좌표 표시 (중심 핀 기반) */}
            <div
              style={{
                background: '#f1f5f9',
                padding: '12px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                📍 지정된 시설 위치 (지도 중심 핀)
              </div>
              <div style={{ color: '#64748b' }}>
                위도: {centerCoords.latitude.toFixed(6)} | 경도: {centerCoords.longitude.toFixed(6)}
              </div>
            </div>

            {/* 시설명 */}
            <IonItem lines="inset">
              <IonLabel position="stacked">시설명 (필수)</IonLabel>
              <IonInput
                value={facilityName}
                placeholder="예: 가로등 S-12, 소화전 4호"
                required
                onIonInput={(e) => setFacilityName(e.detail.value || '')}
              />
            </IonItem>

            {/* 변환된 주소 (수정 가능) */}
            <IonItem lines="inset">
              <IonLabel position="stacked">변환 주소</IonLabel>
              <IonInput
                value={customAddress}
                placeholder="주소 입력 또는 자동 변환값"
                onIonInput={(e) => setCustomAddress(e.detail.value || '')}
              />
            </IonItem>

            {/* 사진 촬영 영역 */}
            <div style={{ margin: '20px 0 16px' }}>
              <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1e293b' }}>
                현장 사진 (긴 변 최대 1280px · WebP 품질 70)
              </div>

              {photoResult ? (
                <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <img
                    src={photoResult.dataUrl}
                    alt="최적화된 현장 사진"
                    style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <IonButton
                      size="small"
                      color="danger"
                      onClick={handleRemovePhoto}
                    >
                      <IonIcon icon={trashOutline} slot="icon-only" />
                    </IonButton>
                  </div>
                </div>
              ) : (
                <IonButton
                  expand="block"
                  fill="outline"
                  color="primary"
                  onClick={handleOpenPhotoCapture}
                >
                  <IonIcon slot="start" icon={cameraOutline} />
                  현장 사진 촬영 / 선택
                </IonButton>
              )}
            </div>

            {/* 비고/메모 */}
            <IonItem lines="inset">
              <IonLabel position="stacked">현장 상태 및 특이사항 메모</IonLabel>
              <IonTextarea
                value={memo}
                rows={3}
                placeholder="시설 파손 여부, 주변 환경 등 특이사항 기재"
                onIonInput={(e) => setMemo(e.detail.value || '')}
              />
            </IonItem>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <IonButton
                type="button"
                fill="clear"
                color="medium"
                style={{ flex: 1 }}
                onClick={onClose}
              >
                취소
              </IonButton>
              <IonButton
                type="submit"
                expand="block"
                color="primary"
                style={{ flex: 2 }}
                disabled={saving}
              >
                {saving ? 'Supabase 전송 중...' : '조사 내용 저장'}
              </IonButton>
            </div>
          </form>

          <IonLoading isOpen={saving} message="Supabase Storage & DB에 저장 중..." />
          <IonToast
            isOpen={!!toastMessage}
            message={toastMessage || ''}
            duration={2500}
            onDidDismiss={() => setToastMessage(null)}
          />
        </IonContent>
      </IonModal>

      {/* 카메라 최적화 촬영 모달 */}
      <CameraWatermarkModal
        isOpen={isCameraOpen}
        options={{
          address: customAddress || address,
          latitude: centerCoords.latitude,
          longitude: centerCoords.longitude,
        }}
        onClose={() => setIsCameraOpen(false)}
        onPhotoReady={handlePhotoReady}
      />
    </>
  );
};

