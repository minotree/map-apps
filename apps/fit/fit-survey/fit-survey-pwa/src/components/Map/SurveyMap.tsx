import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CenterPin } from './CenterPin';
import { userLocationIcon, facilityIcon } from './mapIcons';
import { Coordinates, SurveyData } from '../../types/survey';
import './SurveyMap.css';

interface SurveyMapProps {
  center: Coordinates;
  target: Coordinates | null;
  userLocation: Coordinates | null;
  surveys: SurveyData[];
  onCenterChange: (coords: Coordinates) => void;
  onRequestUserLocation: () => void;
}

// 지도 이동 이벤트 감지 및 중심점 변경 통보 컴포넌트
const MapEventsHandler: React.FC<{
  onCenterChange: (coords: Coordinates) => void;
  setIsMoving: (moving: boolean) => void;
}> = ({ onCenterChange, setIsMoving }) => {
  const map = useMapEvents({
    movestart: () => {
      setIsMoving(true);
    },
    moveend: () => {
      setIsMoving(false);
      const center = map.getCenter();
      onCenterChange({
        latitude: center.lat,
        longitude: center.lng,
      });
    },
  });

  return null;
};

// 외부 위치(GPS 등) 변경 시 지도 중심 부드럽게 이동시키는 컴포넌트
const MapFlyToHandler: React.FC<{ target: Coordinates | null }> = ({ target }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.latitude, target.longitude], 17, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [target, map]);

  return null;
};

// 모바일 화면 회전 및 초기 렌더링 시 지도 회색 빈 영역 방지 리사이즈 핸들러
const MapResizeHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    // Ionic 레이아웃 확장 및 PWA 렌더링 완료 타이밍에 맞추어 점진적 invalidateSize 호출
    const delays = [50, 150, 300, 600, 1200];
    const timers = delays.map((delay) =>
      setTimeout(() => {
        map.invalidateSize();
      }, delay)
    );

    const onResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [map]);

  return null;
};

export const SurveyMap: React.FC<SurveyMapProps> = ({
  center,
  target,
  userLocation,
  surveys,
  onCenterChange,
  onRequestUserLocation,
}) => {
  const [isMoving, setIsMoving] = useState(false);

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={17}
        zoomControl={false}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 이벤트 핸들러 */}
        <MapResizeHandler />
        <MapEventsHandler onCenterChange={onCenterChange} setIsMoving={setIsMoving} />
        <MapFlyToHandler target={target} />

        {/* GPS 사용자 현재 위치 마커 */}
        {userLocation && (
          <>
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={userLocationIcon}
            >
              <Popup>
                <div style={{ textAlign: 'center', padding: '4px' }}>
                  <strong>📍 현재 GPS 위치</strong>
                  <br />
                  <span style={{ fontSize: '11px', color: '#666' }}>
                    정확도: 약 {Math.round(userLocation.accuracy || 0)}m
                  </span>
                </div>
              </Popup>
            </Marker>
            {userLocation.accuracy && (
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={Math.min(userLocation.accuracy, 100)}
                pathOptions={{
                  color: '#3880ff',
                  fillColor: '#3880ff',
                  fillOpacity: 0.12,
                  weight: 1,
                }}
              />
            )}
          </>
        )}

        {/* 기등록된 현장 조사 지점 마커들 */}
        {surveys.map((survey) => (
          <Marker
            key={survey.id || `${survey.latitude}-${survey.longitude}`}
            position={[survey.latitude, survey.longitude]}
            icon={facilityIcon}
          >
            <Popup>
              <div className="survey-popup-content">
                <div className="survey-popup-title">{survey.facility_name}</div>
                <div className="survey-popup-addr">📍 {survey.address}</div>
                {survey.memo && (
                  <div style={{ marginTop: '4px', color: '#444', fontSize: '12px' }}>
                    📝 {survey.memo}
                  </div>
                )}
                <div className="survey-popup-date">
                  조사일시: {survey.created_at ? new Date(survey.created_at).toLocaleString('ko-KR') : '-'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 지도 중심 위치 보정 핀 오버레이 */}
      <CenterPin label="시설 위치 지정" isMoving={isMoving} />

      {/* 현재 위치 이동 플로팅 버튼 */}
      <button
        type="button"
        className="gps-fab"
        onClick={onRequestUserLocation}
        aria-label="현재 GPS 위치로 이동"
        title="현재 위치로 이동"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>
    </div>
  );
};

