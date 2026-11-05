import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonToast,
} from '@ionic/react';
import { listOutline, cameraOutline, createOutline, reloadOutline } from 'ionicons/icons';
import { SurveyMap } from '../components/Map/SurveyMap';
import { SurveyFormModal } from '../components/Survey/SurveyFormModal';
import { SurveyListModal } from '../components/Survey/SurveyListModal';
import { CameraWatermarkModal } from '../components/Camera/CameraWatermarkModal';
import { Coordinates, SurveyData } from '../types/survey';
import { reverseGeocode } from '../services/geocoding';
import { getSurveys } from '../services/surveyService';
import { WatermarkResult } from '../services/watermarker';
import './Home.css';

// 기본 서울 시청 좌표
const DEFAULT_COORDS: Coordinates = {
  latitude: 37.5665,
  longitude: 126.9780,
};

const Home: React.FC = () => {
  const [centerCoords, setCenterCoords] = useState<Coordinates>(DEFAULT_COORDS);
  const [mapTarget, setMapTarget] = useState<Coordinates | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [address, setAddress] = useState<string>('주소 조회 중...');
  const [isAddressLoading, setIsAddressLoading] = useState<boolean>(false);
  const [surveys, setSurveys] = useState<SurveyData[]>([]);

  // 모달 상태
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isListOpen, setIsListOpen] = useState<boolean>(false);
  const [isDirectCameraOpen, setIsDirectCameraOpen] = useState<boolean>(false);
  const [directPhoto, setDirectPhoto] = useState<WatermarkResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 역지오코딩 (Debounce 적용)
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    setIsAddressLoading(true);
    try {
      const resultAddress = await reverseGeocode(lat, lng);

      if (resultAddress) {
        setAddress(resultAddress);
      } else {
        setAddress('주소 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('주소 변환 실패:', error);
      setAddress(`위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`);
    } finally {
      setIsAddressLoading(false);
    }
  }, []);

  const handleCenterChange = useCallback(
    (coords: Coordinates) => {
      setCenterCoords(coords);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        fetchAddress(coords.latitude, coords.longitude);
      }, 450);
    },
    [fetchAddress]
  );

  // 2. GPS 위치 조회 함수 (iOS Safari / Android Chrome 호환)
  const requestCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setToastMessage('이 기기/브라우저는 GPS 위치 조회를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(coords);
        setCenterCoords(coords);
        setMapTarget(coords);
        fetchAddress(coords.latitude, coords.longitude);
        setToastMessage(`현재 위치 수신 성공 (정확도: 약 ${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        console.warn('GPS 수신 에러:', err);
        let msg = '현재 위치를 가져오지 못했습니다.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해 주세요.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS 위치 응답 시간이 초과되었습니다.';
        }
        setToastMessage(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [fetchAddress]);

  // 3. 기등록 조사 내역 로드
  const loadSurveys = useCallback(async () => {
    try {
      const data = await getSurveys();
      setSurveys(data);
      return true;
    } catch (err) {
      console.warn('조사 목록 로드 실패:', err);
      setToastMessage('조사 목록을 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요.');
      return false;
    }
  }, []);

  // 마운트 시 초기화
  useEffect(() => {
    requestCurrentLocation();
    loadSurveys();
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [requestCurrentLocation, loadSurveys]);

  // 새 조사 등록 완료 핸들러
  const handleSurveySaved = async (newSurvey: SurveyData) => {
    const refreshed = await loadSurveys();
    if (refreshed) {
      setToastMessage(`'${newSurvey.facility_name}' 조사가 성공적으로 등록되었습니다.`);
    } else {
      setToastMessage(`'${newSurvey.facility_name}' 조사가 성공적으로 등록되었습니다. 목록 재로드 중 오류가 발생했습니다.`);
    }
  };

  // 목록에서 조사 선택 시 지도 중심 이동
  const handleSelectSurveyFromList = (survey: SurveyData) => {
    const coords = { latitude: survey.latitude, longitude: survey.longitude };
    setCenterCoords(coords);
    setMapTarget(coords);
    setAddress(survey.address);
  };

  // 하단 카메라 직접 촬영 완료 시 폼 자동 오픈 및 사진 전달
  const handleDirectPhotoReady = (result: WatermarkResult) => {
    setDirectPhoto(result);
    setIsFormOpen(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>현장조사 PWA</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={loadSurveys} title="목록 새로고침">
              <IonIcon slot="icon-only" icon={reloadOutline} />
            </IonButton>
            <IonButton onClick={() => setIsListOpen(true)} title="조사 목록">
              <IonIcon slot="icon-only" icon={listOutline} />
              {surveys.length > 0 && (
                <IonBadge color="light" style={{ marginLeft: '4px', fontSize: '10px' }}>
                  {surveys.length}
                </IonBadge>
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="home-content">
        <div className="map-container-full">
          {/* OpenLayers 지도 & 중심 핀 */}
          <SurveyMap
            center={centerCoords}
            target={mapTarget}
            userLocation={userLocation}
            surveys={surveys}
            onCenterChange={handleCenterChange}
            onRequestUserLocation={requestCurrentLocation}
          />

          {/* 하단 플로팅 위치 정보 및 액션 카드 */}
          <div className="bottom-survey-card">
            <div className="bottom-card-header">
              <span className="bottom-card-tag">지도 중심 핀 위치</span>
              <span className="bottom-card-coords">
                {centerCoords.latitude.toFixed(5)}, {centerCoords.longitude.toFixed(5)}
              </span>
            </div>

            <div className="bottom-card-address" title={address}>
              {isAddressLoading ? '주소 변환 중...' : address}
            </div>

            <div className="bottom-card-buttons">
              <IonButton
                className="bottom-btn-camera"
                fill="outline"
                color="primary"
                onClick={() => setIsDirectCameraOpen(true)}
              >
                <IonIcon slot="start" icon={cameraOutline} />
                사진 촬영
              </IonButton>

              <IonButton
                className="bottom-btn-register"
                color="primary"
                onClick={() => setIsFormOpen(true)}
              >
                <IonIcon slot="start" icon={createOutline} />
                현장조사 등록
              </IonButton>
            </div>
          </div>
        </div>

        {/* 조사 등록 모달 */}
        <SurveyFormModal
          isOpen={isFormOpen}
          centerCoords={centerCoords}
          address={address}
          initialPhoto={directPhoto}
          onClose={() => {
            setIsFormOpen(false);
            setDirectPhoto(null);
          }}
          onSurveySaved={handleSurveySaved}
        />

        {/* 조사 내역 목록 모달 */}
        <SurveyListModal
          isOpen={isListOpen}
          surveys={surveys}
          onClose={() => setIsListOpen(false)}
          onSelectSurvey={handleSelectSurveyFromList}
        />

        {/* 직접 카메라 촬영 모달 */}
        <CameraWatermarkModal
          isOpen={isDirectCameraOpen}
          options={{
            address,
            latitude: centerCoords.latitude,
            longitude: centerCoords.longitude,
          }}
          onClose={() => setIsDirectCameraOpen(false)}
          onPhotoReady={handleDirectPhotoReady}
        />

        <IonToast
          isOpen={!!toastMessage}
          message={toastMessage || ''}
          duration={3000}
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;

