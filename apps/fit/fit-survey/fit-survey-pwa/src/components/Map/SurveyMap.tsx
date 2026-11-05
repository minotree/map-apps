import React, { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import Feature from 'ol/Feature';
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import CircleGeometry from 'ol/geom/Circle';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Icon, Stroke, Style } from 'ol/style';
import 'ol/ol.css';
import { CenterPin } from './CenterPin';
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

const createMarkerIcon = (color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><path fill="${color}" stroke="#fff" stroke-width="2" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26s16-14 16-26C32 7.163 24.837 0 16 0z"/><circle cx="16" cy="16" r="6" fill="#fff"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const facilityMarkerStyle = new Style({
  image: new Icon({
    anchor: [0.5, 1],
    anchorXUnits: 'fraction',
    anchorYUnits: 'fraction',
    src: createMarkerIcon('#2dd36f'),
  }),
});

const userLocationStyle = new Style({
  image: new CircleStyle({
    radius: 9,
    fill: new Fill({ color: '#3880ff' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
});

const accuracyStyle = new Style({
  fill: new Fill({ color: 'rgba(56, 128, 255, 0.12)' }),
  stroke: new Stroke({ color: '#3880ff', width: 1 }),
});

export const SurveyMap: React.FC<SurveyMapProps> = ({
  center,
  target,
  userLocation,
  surveys,
  onCenterChange,
  onRequestUserLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const surveyLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const locationLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const lastTargetRef = useRef<Coordinates | null>(null);
  const initialCenterRef = useRef(center);
  const [isMoving, setIsMoving] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyData | null>(null);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  useEffect(() => {
    const container = mapContainerRef.current;
    const popupElement = popupRef.current;
    if (!container || !popupElement || mapRef.current) return;

    const apiKey = import.meta.env.VITE_VWORLD_API_KEY;
    const tileLayer = new TileLayer({
      source: new XYZ({
        url: `https://api.vworld.kr/req/wmts/1.0.0/${encodeURIComponent(apiKey)}/Base/{z}/{y}/{x}.png`,
        crossOrigin: 'anonymous',
        attributions: '&copy; <a href="https://www.vworld.kr/">V-World</a>',
      }),
    });
    const popupOverlay = new Overlay({
      element: popupElement,
      positioning: 'bottom-center',
      offset: [0, -46],
      autoPan: { animation: { duration: 200 } },
    });
    const initialCenter = initialCenterRef.current;
    const map = new Map({
      target: container,
      layers: [tileLayer],
      overlays: [popupOverlay],
      view: new View({
        center: fromLonLat([initialCenter.longitude, initialCenter.latitude]),
        zoom: 17,
      }),
      controls: [],
    });

    const handleMoveStart = () => setIsMoving(true);
    const handleMoveEnd = () => {
      setIsMoving(false);
      const projectedCenter = map.getView().getCenter();
      if (!projectedCenter) return;
      const [longitude, latitude] = toLonLat(projectedCenter);
      onCenterChangeRef.current({ latitude, longitude });
    };
    const handleClick = (event: { pixel: number[] }) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, candidate => candidate);
      const survey = feature?.get('survey') as SurveyData | undefined;
      if (!feature || !survey) {
        setSelectedSurvey(null);
        popupOverlay.setPosition(undefined);
        return;
      }
      setSelectedSurvey(survey);
      popupOverlay.setPosition((feature.getGeometry() as Point).getCoordinates());
    };
    const updateSize = () => map.updateSize();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestAnimationFrame(updateSize);
    };

    map.on('movestart', handleMoveStart);
    map.on('moveend', handleMoveEnd);
    map.on('click', handleClick);
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);
    window.addEventListener('pageshow', updateSize);
    document.addEventListener('visibilitychange', handleVisibility);
    mapRef.current = map;
    requestAnimationFrame(updateSize);

    return () => {
      map.un('movestart', handleMoveStart);
      map.un('moveend', handleMoveEnd);
      map.un('click', handleClick);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
      window.removeEventListener('pageshow', updateSize);
      document.removeEventListener('visibilitychange', handleVisibility);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (surveyLayerRef.current) map.removeLayer(surveyLayerRef.current);

    const features = surveys.map(survey => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([survey.longitude, survey.latitude])),
        survey,
      });
      feature.setStyle(facilityMarkerStyle);
      return feature;
    });
    const layer = new VectorLayer({ source: new VectorSource({ features }) });
    map.addLayer(layer);
    surveyLayerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      if (surveyLayerRef.current === layer) surveyLayerRef.current = null;
    };
  }, [surveys]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (locationLayerRef.current) map.removeLayer(locationLayerRef.current);
    if (!userLocation) {
      locationLayerRef.current = null;
      return;
    }

    const projected = fromLonLat([userLocation.longitude, userLocation.latitude]);
    const features: Feature[] = [];
    if (userLocation.accuracy) {
      const accuracyFeature = new Feature({
        geometry: new CircleGeometry(projected, Math.min(userLocation.accuracy, 100)),
      });
      accuracyFeature.setStyle(accuracyStyle);
      features.push(accuracyFeature);
    }
    const marker = new Feature({ geometry: new Point(projected) });
    marker.setStyle(userLocationStyle);
    features.push(marker);

    const layer = new VectorLayer({ source: new VectorSource({ features }) });
    map.addLayer(layer);
    locationLayerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      if (locationLayerRef.current === layer) locationLayerRef.current = null;
    };
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !target) return;
    const previous = lastTargetRef.current;
    if (previous?.latitude === target.latitude && previous.longitude === target.longitude) return;
    lastTargetRef.current = target;
    map.getView().animate({
      center: fromLonLat([target.longitude, target.latitude]),
      zoom: 17,
      duration: 500,
    });
  }, [target]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="openlayers-map" data-testid="openlayers-map" />
      <div ref={popupRef} className={`survey-map-popup${selectedSurvey ? ' is-open' : ''}`}>
        {selectedSurvey && (
          <div className="survey-popup-content">
            <div className="survey-popup-title">{selectedSurvey.facility_name}</div>
            <div className="survey-popup-addr">📍 {selectedSurvey.address}</div>
            {selectedSurvey.memo && <div className="survey-popup-memo">📝 {selectedSurvey.memo}</div>}
            <div className="survey-popup-date">
              조사일시: {selectedSurvey.created_at ? new Date(selectedSurvey.created_at).toLocaleString('ko-KR') : '-'}
            </div>
          </div>
        )}
      </div>
      <CenterPin label="시설 위치 지정" isMoving={isMoving} />
      <button type="button" className="gps-fab" onClick={onRequestUserLocation} aria-label="현재 GPS 위치로 이동" title="현재 위치로 이동">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
        </svg>
      </button>
    </div>
  );
};
