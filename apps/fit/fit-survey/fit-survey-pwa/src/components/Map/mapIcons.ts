import L from 'leaflet';

// GPS 사용자 현재 위치 아이콘
export const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <div style="
      position: relative;
      width: 20px;
      height: 20px;
    ">
      <div style="
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: rgba(56, 128, 255, 0.3);
        border-radius: 50%;
        animation: pulse 1.5s infinite;
      "></div>
      <div style="
        position: absolute;
        top: 3px;
        left: 3px;
        width: 14px;
        height: 14px;
        background-color: #3880ff;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// 등록된 시설 조사 포인트 아이콘
export const facilityIcon = L.divIcon({
  className: 'facility-marker',
  html: `
    <div style="
      background-color: #2dd36f;
      color: #ffffff;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.35);
      border: 2px solid #ffffff;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 13px;
        font-weight: bold;
      ">🏢</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

