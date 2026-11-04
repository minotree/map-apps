// src/services/geocoding.ts

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const apiKey = import.meta.env.VITE_VWORLD_API_KEY;

  if (!apiKey) {
    console.warn('Vworld API Key가 설정되지 않았습니다.');
    return '주소 정보를 불러올 수 없습니다 (API 키 필요)';
  }

  // Vite 프록시 URL 사용 (/api-vworld)
  const url = `/api-vworld/req/address?service=address&request=getAddress&version=2.0&crs=epsg:4326&point=${lng},${lat}&format=json&type=both&zipcode=true&simple=false&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // Vworld 응답 성공 검증
    if (data.response && data.response.status === 'OK' && data.response.result?.length > 0) {
      // 한국식 도로명/지번 주소 반환 (예: "서울특별시 중구 세종대로 110")
      return data.response.result[0].text;
    } else {
      return '주소 미등록 지역';
    }
  } catch (error) {
    console.error('Vworld reverse geocoding error:', error);
    return '주소 조회 실패';
  }
}
