import {
  WORLD_MAP_SCALE,
  WORLD_MAP_TRANSLATE,
  WORLD_MAP_WIDTH,
  WORLD_MAP_HEIGHT,
} from "@/data/worldMapPath";

export interface LatLng {
  lat: number;
  lng: number;
}

/** World-space size of the map plane — kept at the same 2:1 aspect as the texture. */
export const WORLD_MAP_WORLD_WIDTH = 150;
export const WORLD_MAP_WORLD_HEIGHT = WORLD_MAP_WORLD_WIDTH / (WORLD_MAP_WIDTH / WORLD_MAP_HEIGHT);

/** Projects lat/lng into the same 2048x1024 texture space the map path was drawn in (d3 geoEquirectangular, identical scale/translate). */
function projectLatLngToTexture({ lat, lng }: LatLng): { x: number; y: number } {
  const lambda = (lng * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  return {
    x: WORLD_MAP_TRANSLATE[0] + WORLD_MAP_SCALE * lambda,
    y: WORLD_MAP_TRANSLATE[1] - WORLD_MAP_SCALE * phi,
  };
}

/** Projects lat/lng straight into the 3D scene's world units, matching the map plane's placement. */
export function projectLatLngToWorld({ lat, lng }: LatLng): { x: number; y: number } {
  const tex = projectLatLngToTexture({ lat, lng });
  return {
    x: (tex.x / WORLD_MAP_WIDTH - 0.5) * WORLD_MAP_WORLD_WIDTH,
    y: (0.5 - tex.y / WORLD_MAP_HEIGHT) * WORLD_MAP_WORLD_HEIGHT,
  };
}

/** Representative coordinates for each origin country used in the mock catalogue. */
export const COUNTRY_COORDS: Record<string, LatLng> = {
  "United States": { lat: 39, lng: -98 },
  India: { lat: 21, lng: 79 },
  Sweden: { lat: 59.3, lng: 18.1 },
  "United Kingdom": { lat: 51.5, lng: -0.1 },
  Japan: { lat: 35.7, lng: 139.7 },
  China: { lat: 39.9, lng: 116.4 },
  Australia: { lat: -33.9, lng: 151.2 },
  Netherlands: { lat: 52.4, lng: 4.9 },
  Israel: { lat: 32.1, lng: 34.8 },
  Canada: { lat: 43.7, lng: -79.4 },
  Lithuania: { lat: 54.7, lng: 25.3 },
  Norway: { lat: 59.9, lng: 10.7 },
  Switzerland: { lat: 47.4, lng: 8.5 },
  Germany: { lat: 52.5, lng: 13.4 },
  "United Arab Emirates": { lat: 25.2, lng: 55.3 },
};
