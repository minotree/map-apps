import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonThumbnail,
  IonIcon,
} from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { SurveyData } from '../../types/survey';

interface SurveyListModalProps {
  isOpen: boolean;
  surveys: SurveyData[];
  onClose: () => void;
  onSelectSurvey: (survey: SurveyData) => void;
}

export const SurveyListModal: React.FC<SurveyListModalProps> = ({
  isOpen,
  surveys,
  onClose,
  onSelectSurvey,
}) => {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>오늘 조사 내역 목록 ({surveys.length}건)</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>닫기</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {surveys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>오늘 등록된 시설 조사 내역이 없습니다.</p>
            <p style={{ fontSize: '13px', color: '#999' }}>지도의 중심 핀으로 시설 위치를 지정하고 조사를 시작해 보세요.</p>
          </div>
        ) : (
          <IonList>
            {surveys.map((survey) => (
              <IonItem
                key={survey.id || `${survey.latitude}-${survey.longitude}`}
                button
                onClick={() => {
                  onSelectSurvey(survey);
                  onClose();
                }}
              >
                {survey.photo_url && (
                  <IonThumbnail slot="start">
                    <img src={survey.photo_url} alt={survey.facility_name} />
                  </IonThumbnail>
                )}
                <IonLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontWeight: 700, margin: 0 }}>{survey.facility_name}</h2>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>📍 {survey.address}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {survey.created_at ? new Date(survey.created_at).toLocaleString('ko-KR') : ''}
                  </p>
                </IonLabel>
                <IonIcon icon={locationOutline} slot="end" color="medium" />
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
};
