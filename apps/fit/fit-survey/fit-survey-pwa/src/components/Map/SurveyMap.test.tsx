import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SurveyMap } from './SurveyMap';

const { map, tileLayer } = vi.hoisted(() => ({
  map: { flyTo: vi.fn(), invalidateSize: vi.fn() },
  tileLayer: vi.fn(),
}));
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TileLayer: (props: { url: string; attribution: string }) => { tileLayer(props); return null; },
  Marker: () => null,
  Popup: () => null,
  Circle: () => null,
  useMap: () => map,
  useMapEvents: () => map,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

test('GPS 수신·목록 선택 시 이동하고 수동 지도 이동 시 되돌리지 않는다', () => {
  const center = { latitude: 37.5665, longitude: 126.978 };
  const props = {
    center, target: null, userLocation: null, surveys: [],
    onCenterChange: vi.fn(), onRequestUserLocation: vi.fn(),
  };
  const { rerender } = render(<SurveyMap {...props} />);
  expect(map.flyTo).not.toHaveBeenCalled();

  const gps = { latitude: 37.5, longitude: 127 };
  rerender(<SurveyMap {...props} target={gps} userLocation={gps} />);
  expect(map.flyTo).toHaveBeenLastCalledWith([37.5, 127], 17, expect.any(Object));

  const selected = { latitude: 37.6, longitude: 127.1 };
  rerender(<SurveyMap {...props} target={selected} userLocation={gps} />);
  expect(map.flyTo).toHaveBeenLastCalledWith([37.6, 127.1], 17, expect.any(Object));

  map.flyTo.mockClear();
  rerender(<SurveyMap {...props} center={gps} target={selected} userLocation={gps} />);
  expect(map.flyTo).not.toHaveBeenCalled();
});

test('V-World WMTS 타일과 출처를 사용한다', () => {
  render(<SurveyMap
    center={{ latitude: 37.5665, longitude: 126.978 }} target={null} userLocation={null} surveys={[]}
    onCenterChange={vi.fn()} onRequestUserLocation={vi.fn()}
  />);

  expect(tileLayer).toHaveBeenCalledWith(expect.objectContaining({
    url: expect.stringMatching(/^https:\/\/api\.vworld\.kr\/req\/wmts\/1\.0\.0\/.+\/Base\/\{z\}\/\{y\}\/\{x\}\.png$/),
    attribution: expect.stringContaining('V-World'),
  }));
});

