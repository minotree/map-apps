interface VworldAddressResponse {
  response?: {
    status?: string;
    result?: Array<{ text?: string }>;
  };
}

const VWORLD_ADDRESS_URL = 'https://api.vworld.kr/req/address';
const JSONP_TIMEOUT_MS = 10_000;

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const apiKey = import.meta.env.VITE_VWORLD_API_KEY;

  if (!apiKey) {
    console.warn('V-World API 키가 설정되지 않았습니다.');
    return '주소 정보를 불러올 수 없습니다 (API 키 필요)';
  }

  const callbackName = `__walkFitVworld_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const params = new URLSearchParams({
    service: 'address',
    request: 'getAddress',
    version: '2.0',
    crs: 'epsg:4326',
    point: `${lng},${lat}`,
    format: 'json',
    type: 'both',
    zipcode: 'true',
    simple: 'false',
    callback: callbackName,
    key: apiKey,
  });

  try {
    const data = await requestJsonp<VworldAddressResponse>(
      `${VWORLD_ADDRESS_URL}?${params.toString()}`,
      callbackName,
    );
    const address = data.response?.result?.[0]?.text;

    if (data.response?.status === 'OK' && address) {
      return address;
    }

    return '주소 미등록 지역';
  } catch (error) {
    console.error('V-World reverse geocoding error:', error);
    return '주소 조회 실패';
  }
}

function requestJsonp<T>(url: string, callbackName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const callbackTarget = window as typeof window & Record<string, unknown>;
    let timeoutId = 0;

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      script.remove();
      delete callbackTarget[callbackName];
    };

    callbackTarget[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.src = url;
    script.async = true;
    script.onerror = () => {
      cleanup();
      reject(new Error('V-World 주소 API 스크립트를 불러오지 못했습니다.'));
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('V-World 주소 API 응답 시간이 초과되었습니다.'));
    }, JSONP_TIMEOUT_MS);

    document.head.appendChild(script);
  });
}
