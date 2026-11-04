import React, { useEffect, useState } from 'react';
import { reverseGeocode } from '../services/geocoding';
import { Coordinates } from '../types/survey';

interface MapViewProps {
  center: Coordinates;
  onAddressChange?: (address: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ center, onAddressChange }) => {
  const [address, setAddress] = useState<string>('주소 조회 중...');

  useEffect(() => {
    let isMounted = true;

    const fetchAddressData = async () => {
      try {
        const addressText = await reverseGeocode(center.latitude, center.longitude);
        const finalAddress = addressText || '주소 정보를 찾을 수 없습니다.';

        if (isMounted) {
          setAddress(finalAddress);
          if (onAddressChange) {
            onAddressChange(finalAddress);
          }
        }
      } catch (error) {
        console.error('MapView 주소 변환 에러:', error);
        if (isMounted) {
          const fallbackText = `위도: ${center.latitude.toFixed(6)}, 경도: ${center.longitude.toFixed(6)}`;
          setAddress(fallbackText);
          if (onAddressChange) {
            onAddressChange(fallbackText);
          }
        }
      }
    };

    fetchAddressData();

    return () => {
      isMounted = false;
    };
  }, [center.latitude, center.longitude, onAddressChange]);

  return (
    <div className="map-view-info">
      <span>📍 {address}</span>
    </div>
  );
};

export default MapView;

