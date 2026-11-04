export interface SurveyData {
  id?: string;
  facility_name: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address: string;
  stamped_photo_url?: string | null;
  memo?: string;
  surveyor?: string;
  category?: string;
  photo_url?: string;
  created_at?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface WatermarkOptions {
  address: string;
  latitude: number;
  longitude: number;
  timestamp?: Date;
  facilityName?: string;
  surveyor?: string;
}

export interface GeocodingResult {
  address: string;
  roadAddress?: string;
  raw?: unknown;
}

export interface SurveyLocationRow {
  id?: string;
  facility_name: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  address: string;
  stamped_photo_path?: string | null;
  taken_at?: string | null;
  status?: string;
  review_note?: string;
  linked_site_id?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

