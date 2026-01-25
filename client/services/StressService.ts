export interface StressAnalysisResult {
  success: boolean;
  crop: string;
  analysis: {
    image: {
      isHealthy: boolean;
      confidence: number;
      diseases: Array<{
        name: string;
        type: 'disease' | 'nutrient_deficiency' | 'water_stress' | 'pest';
        probability: number;
        treatment: string[];
        prevention: string[];
      }>;
    };
    satellite?: {
      ndvi: string;
      health: string;
      severity: 'healthy' | 'moderate' | 'stressed' | 'critical' | 'unknown';
      stress: string[];
      lastUpdated: string;
      satelliteImage?: string;
    } | null;
  };
  stressTypes: string[];
  severity: string;
  recommendations: string[];
  timestamp: string;
}

export interface PolygonResponse {
  success: boolean;
  polygon: {
    id: string;
    name: string;
    area: number;
    center: [number, number];
    createdAt: string;
  };
}

export interface SatelliteHealthResponse {
  success: boolean;
  vegetation: {
    ndvi: string;
    health: string;
    severity: string;
    stress: string[];
    satelliteImage?: string;
    lastUpdated: string;
  };
  soil?: {
    moisture: string;
    temperature: string;
    waterStress: boolean;
    timestamp: string;
  } | null;
}

/**
 * Analyze crop stress using image + optional satellite data
 */
export async function analyzeStress(formData: FormData): Promise<StressAnalysisResult> {
  const response = await fetch('/api/stress/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to analyze stress');
  }

  return response.json();
}

/**
 * Create farm polygon for satellite monitoring
 */
export async function createFarmPolygon(
  farmId: string,
  latitude: number,
  longitude: number,
  areaAcres: number
): Promise<PolygonResponse> {
  const response = await fetch('/api/stress/polygon', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      farmId,
      latitude,
      longitude,
      areaAcres,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create polygon');
  }

  return response.json();
}

/**
 * Get satellite health data for a polygon
 */
export async function getSatelliteHealth(polygonId: string): Promise<SatelliteHealthResponse> {
  const response = await fetch(`/api/stress/satellite/${polygonId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch satellite data');
  }

  return response.json();
}

/**
 * List all farm polygons
 */
export async function listPolygons(): Promise<{
  success: boolean;
  polygons: Array<{
    id: string;
    name: string;
    area: number;
    center: [number, number];
    createdAt: string;
  }>;
}> {
  const response = await fetch('/api/stress/polygons');

  if (!response.ok) {
    throw new Error('Failed to list polygons');
  }

  return response.json();
}

/**
 * Delete a farm polygon
 */
export async function deletePolygon(polygonId: string): Promise<void> {
  const response = await fetch(`/api/stress/polygon/${polygonId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete polygon');
  }
}
