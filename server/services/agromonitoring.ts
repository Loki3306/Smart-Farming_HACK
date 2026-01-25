import fetch from 'node-fetch';

const AGRO_API_KEY = process.env.AGROMONITORING_API_KEY || process.env.OPENWEATHER_API_KEY;
const AGRO_BASE_URL = 'https://api.agromonitoring.com/agro/1.0';

interface NDVIData {
  dt: number;
  source: string;
  dc: number;
  cl: number;
  data: {
    mean: number; // 0-1 scale, >0.6 = healthy, <0.3 = stress
    std: number;
    min: number;
    max: number;
  };
  image: {
    truecolor: string;
    falsecolor: string;
    ndvi: string;
  };
}

interface PolygonResponse {
  id: string;
  name: string;
  center: [number, number];
  area: number;
  created_at: number;
}

interface SoilMoistureData {
  dt: number;
  t10: number; // Soil temperature at 10cm depth
  moisture: number; // Soil moisture m³/m³
  t0: number; // Surface temperature
}

/**
 * Create a farm polygon for monitoring
 * @param farmId - Unique farm identifier
 * @param lat - Latitude of farm center
 * @param lon - Longitude of farm center
 * @param areaAcres - Farm area in acres
 */
export async function createFarmPolygon(
  farmId: string,
  lat: number,
  lon: number,
  areaAcres: number
): Promise<PolygonResponse> {
  // Convert acres to approximate lat/lon offset (rough estimate)
  // 1 acre ≈ 4047 m², convert to degrees (1° ≈ 111,320 meters)
  const offset = Math.sqrt(areaAcres * 4047) / 111320;

  const response = await fetch(`${AGRO_BASE_URL}/polygons?appid=${AGRO_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Farm_${farmId}`,
      geo_json: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lon, lat],
            [lon + offset, lat],
            [lon + offset, lat + offset],
            [lon, lat + offset],
            [lon, lat]
          ]]
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Agromonitoring API error: ${response.statusText}`);
  }

  return response.json() as Promise<PolygonResponse>;
}

/**
 * Get vegetation health from NDVI satellite data
 * @param polygonId - Polygon ID from createFarmPolygon
 * @returns Health assessment with NDVI values and stress indicators
 */
export async function getVegetationHealth(polygonId: string): Promise<{
  health: string;
  ndvi: number;
  stress: string[];
  severity: 'healthy' | 'moderate' | 'stressed' | 'critical' | 'unknown';
  satelliteImage?: string;
  lastUpdated: number;
}> {
  const end = Math.floor(Date.now() / 1000);
  const start = end - (30 * 24 * 3600); // 30 days ago

  const response = await fetch(
    `${AGRO_BASE_URL}/ndvi/history?polyid=${polygonId}&start=${start}&end=${end}&appid=${AGRO_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`NDVI API error: ${response.statusText}`);
  }

  const data: NDVIData[] = await response.json() as NDVIData[];

  if (!data || data.length === 0) {
    return {
      health: 'unknown',
      ndvi: 0,
      stress: ['No satellite data available yet. Data updates every 5 days.'],
      severity: 'unknown',
      lastUpdated: Date.now()
    };
  }

  // Get latest NDVI reading
  const latest = data[data.length - 1];
  const ndvi = latest.data.mean;

  // Interpret NDVI values
  let health = 'unknown';
  let severity: 'healthy' | 'moderate' | 'stressed' | 'critical' | 'unknown' = 'unknown';
  const stress: string[] = [];

  if (ndvi > 0.6) {
    health = 'Healthy vegetation with good chlorophyll content';
    severity = 'healthy';
  } else if (ndvi > 0.4) {
    health = 'Moderate vegetation health';
    severity = 'moderate';
    stress.push('Mild vegetation stress detected');
    stress.push('Consider checking irrigation and nutrient levels');
  } else if (ndvi > 0.2) {
    health = 'Stressed vegetation';
    severity = 'stressed';
    stress.push('Significant vegetation stress detected');
    stress.push('Check water availability immediately');
    stress.push('Verify nutrient levels (N, P, K)');
    stress.push('Inspect for pest or disease damage');
  } else {
    health = 'Critical vegetation stress';
    severity = 'critical';
    stress.push('CRITICAL: Severe vegetation stress');
    stress.push('Immediate action required');
    stress.push('Check irrigation system immediately');
    stress.push('Test soil nutrients');
    stress.push('Inspect crops for disease or pest damage');
  }

  return {
    health,
    ndvi,
    stress,
    severity,
    satelliteImage: latest.image?.ndvi,
    lastUpdated: latest.dt * 1000
  };
}

/**
 * Get soil moisture data
 * @param polygonId - Polygon ID
 * @returns Soil moisture and temperature data
 */
export async function getSoilMoisture(polygonId: string): Promise<{
  moisture: number;
  temperature: number;
  surfaceTemp: number;
  waterStress: boolean;
  timestamp: number;
}> {
  const response = await fetch(
    `${AGRO_BASE_URL}/soil?polyid=${polygonId}&appid=${AGRO_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Soil API error: ${response.statusText}`);
  }

  const data: SoilMoistureData = await response.json() as SoilMoistureData;

  // Soil moisture interpretation
  // Typical range: 0.1-0.4 m³/m³
  // <0.15 = water stress, >0.3 = well watered
  const waterStress = data.moisture < 0.15;

  return {
    moisture: data.moisture,
    temperature: data.t10,
    surfaceTemp: data.t0,
    waterStress,
    timestamp: data.dt * 1000
  };
}

/**
 * Get all available polygons
 */
export async function listPolygons(): Promise<PolygonResponse[]> {
  const response = await fetch(
    `${AGRO_BASE_URL}/polygons?appid=${AGRO_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`Polygons API error: ${response.statusText}`);
  }

  return response.json() as Promise<PolygonResponse[]>;
}

/**
 * Delete a polygon
 */
export async function deletePolygon(polygonId: string): Promise<void> {
  const response = await fetch(
    `${AGRO_BASE_URL}/polygons/${polygonId}?appid=${AGRO_API_KEY}`,
    { method: 'DELETE' }
  );

  if (!response.ok) {
    throw new Error(`Delete polygon error: ${response.statusText}`);
  }
}
