import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { SurveyMap } from './SurveyMap';

const mocks = vi.hoisted(() => {
  const view = {
    animate: vi.fn(),
    getCenter: vi.fn(() => [126.978, 37.5665]),
  };
  const map = {
    on: vi.fn(),
    un: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    updateSize: vi.fn(),
    setTarget: vi.fn(),
    getView: vi.fn(() => view),
    forEachFeatureAtPixel: vi.fn(),
  };
  const xyz = vi.fn();
  return { map, view, xyz };
});

vi.mock('ol/Map', () => ({ default: class { constructor() { return mocks.map; } } }));
vi.mock('ol/View', () => ({ default: class { constructor() { return mocks.view; } } }));
vi.mock('ol/Feature', () => ({
  default: class {
    values: Record<string, unknown>;
    constructor(values: Record<string, unknown>) { this.values = values; }
    setStyle() {}
    get(key: string) { return this.values[key]; }
    getGeometry() { return this.values.geometry; }
  },
}));
vi.mock('ol/Overlay', () => ({ default: class { setPosition() {} } }));
vi.mock('ol/geom/Point', () => ({ default: class { constructor(public coordinates: number[]) {} getCoordinates() { return this.coordinates; } } }));
vi.mock('ol/geom/Circle', () => ({ default: class {} }));
vi.mock('ol/layer/Tile', () => ({ default: class {} }));
vi.mock('ol/layer/Vector', () => ({ default: class {} }));
vi.mock('ol/source/XYZ', () => ({
  default: class {
    constructor(options: unknown) { mocks.xyz(options); }
  },
}));
vi.mock('ol/source/Vector', () => ({ default: class {} }));
vi.mock('ol/style', () => ({
  Circle: class {},
  Fill: class {},
  Icon: class {},
  Stroke: class {},
  Style: class {},
}));
vi.mock('ol/proj', () => ({
  fromLonLat: ([longitude, latitude]: number[]) => [longitude, latitude],
  toLonLat: ([longitude, latitude]: number[]) => [longitude, latitude],
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const baseProps = {
  center: { latitude: 37.5665, longitude: 126.978 },
  target: null,
  userLocation: null,
  surveys: [],
  onCenterChange: vi.fn(),
  onRequestUserLocation: vi.fn(),
};

test('OpenLayers와 V-World WMTS 타일을 사용한다', () => {
  render(<SurveyMap {...baseProps} />);

  expect(screen.getByTestId('openlayers-map')).toBeDefined();
  expect(mocks.xyz).toHaveBeenCalledWith(expect.objectContaining({
    url: expect.stringMatching(/^https:\/\/api\.vworld\.kr\/req\/wmts\/1\.0\.0\/.+\/Base\/\{z\}\/\{y\}\/\{x\}\.png$/),
    attributions: expect.stringContaining('V-World'),
  }));
});

test('GPS 수신·목록 선택 시 이동하고 동일 위치로 되돌리지 않는다', () => {
  const { rerender } = render(<SurveyMap {...baseProps} />);
  expect(mocks.view.animate).not.toHaveBeenCalled();

  const gps = { latitude: 37.5, longitude: 127 };
  rerender(<SurveyMap {...baseProps} target={gps} userLocation={gps} />);
  expect(mocks.view.animate).toHaveBeenLastCalledWith(expect.objectContaining({
    center: [127, 37.5],
    zoom: 17,
  }));

  mocks.view.animate.mockClear();
  rerender(<SurveyMap {...baseProps} center={gps} target={gps} userLocation={gps} />);
  expect(mocks.view.animate).not.toHaveBeenCalled();
});

test('현재 위치 버튼을 누르면 GPS 조회를 요청한다', () => {
  const onRequestUserLocation = vi.fn();
  render(<SurveyMap {...baseProps} onRequestUserLocation={onRequestUserLocation} />);

  fireEvent.click(screen.getByRole('button', { name: '현재 GPS 위치로 이동' }));
  expect(onRequestUserLocation).toHaveBeenCalledOnce();
});
