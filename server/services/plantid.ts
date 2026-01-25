import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const PLANTID_API_KEY = process.env.PLANTID_API_KEY;
const PLANTID_BASE_URL = 'https://plant.id/api/v3';

interface PlantIdDisease {
  name: string;
  probability: number;
  disease_details: {
    common_names: string[];
    url: string;
    description?: string;
    treatment?: {
      biological?: string[];
      chemical?: string[];
      prevention?: string[];
    };
  };
}

interface PlantIdResponse {
  access_token: string;
  model_version: string;
  custom_id?: string;
  input: {
    latitude: number;
    longitude: number;
    similar_images: boolean;
  };
  result: {
    is_healthy: {
      probability: number;
      binary: boolean;
    };
    is_plant: {
      probability: number;
      binary: boolean;
    };
    disease: {
      suggestions: PlantIdDisease[];
    };
  };
  status: string;
  completed_at: number;
}

/**
 * Detect plant stress and diseases using Plant.id API
 * @param imageBuffer - Image buffer or file path
 * @param lat - Latitude (optional)
 * @param lon - Longitude (optional)
 * @returns Stress and disease detection results
 */
export async function detectPlantStress(
  imageBuffer: Buffer | string,
  lat: number = 0,
  lon: number = 0
): Promise<{
  isHealthy: boolean;
  confidence: number;
  diseases: Array<{
    name: string;
    probability: number;
    type: 'disease' | 'nutrient_deficiency' | 'water_stress' | 'pest';
    treatment: string[];
    prevention: string[];
  }>;
  stressTypes: string[];
}> {
  if (!PLANTID_API_KEY) {
    throw new Error('PLANTID_API_KEY is not configured. Sign up at https://web.plant.id/');
  }

  // Convert image to base64
  let base64Image: string;
  if (Buffer.isBuffer(imageBuffer)) {
    base64Image = imageBuffer.toString('base64');
  } else if (typeof imageBuffer === 'string') {
    // Assume it's a file path
    const fileBuffer = fs.readFileSync(imageBuffer);
    base64Image = fileBuffer.toString('base64');
  } else {
    throw new Error('Invalid image input');
  }

  const response = await fetch(`${PLANTID_BASE_URL}/health_assessment`, {
    method: 'POST',
    headers: {
      'Api-Key': PLANTID_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      images: [`data:image/jpeg;base64,${base64Image}`],
      latitude: lat,
      longitude: lon,
      similar_images: true,
      health: 'all'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Plant.id API error: ${response.status} - ${errorText}`);
  }

  const data: PlantIdResponse = await response.json() as PlantIdResponse;

  // Process results
  const isHealthy = data.result.is_healthy.binary;
  const confidence = data.result.is_healthy.probability;

  const diseases = (data.result.disease.suggestions || []).map(disease => {
    // Categorize disease type based on name
    let type: 'disease' | 'nutrient_deficiency' | 'water_stress' | 'pest' = 'disease';
    const diseaseName = disease.name.toLowerCase();

    if (diseaseName.includes('nitrogen') || diseaseName.includes('deficiency') ||
        diseaseName.includes('nutrient') || diseaseName.includes('chlorosis')) {
      type = 'nutrient_deficiency';
    } else if (diseaseName.includes('water') || diseaseName.includes('drought') ||
               diseaseName.includes('wilting')) {
      type = 'water_stress';
    } else if (diseaseName.includes('pest') || diseaseName.includes('insect') ||
               diseaseName.includes('aphid') || diseaseName.includes('mite')) {
      type = 'pest';
    }

    const treatment = [
      ...(disease.disease_details?.treatment?.biological || []),
      ...(disease.disease_details?.treatment?.chemical || [])
    ];

    const prevention = disease.disease_details?.treatment?.prevention || [];

    return {
      name: disease.name,
      probability: disease.probability,
      type,
      treatment: treatment.slice(0, 3), // Top 3 treatments
      prevention: prevention.slice(0, 3) // Top 3 preventions
    };
  });

  // Extract unique stress types
  const stressTypes = [...new Set(diseases.map(d => {
    switch (d.type) {
      case 'nutrient_deficiency': return 'Nutrient Deficiency';
      case 'water_stress': return 'Water Stress';
      case 'pest': return 'Pest Damage';
      case 'disease': return 'Disease';
      default: return 'Unknown';
    }
  }))];

  return {
    isHealthy,
    confidence,
    diseases,
    stressTypes
  };
}

/**
 * Simplified stress detection for quick checks
 * @param imageBuffer - Image buffer
 * @returns Quick stress assessment
 */
export async function quickStressCheck(imageBuffer: Buffer): Promise<{
  stressed: boolean;
  stressLevel: 'none' | 'low' | 'moderate' | 'high';
  primaryIssue?: string;
}> {
  try {
    const result = await detectPlantStress(imageBuffer);

    if (result.isHealthy) {
      return {
        stressed: false,
        stressLevel: 'none'
      };
    }

    // Find highest probability disease
    const topDisease = result.diseases.sort((a, b) => b.probability - a.probability)[0];

    let stressLevel: 'none' | 'low' | 'moderate' | 'high' = 'none';
    if (topDisease.probability > 0.7) {
      stressLevel = 'high';
    } else if (topDisease.probability > 0.5) {
      stressLevel = 'moderate';
    } else if (topDisease.probability > 0.3) {
      stressLevel = 'low';
    }

    return {
      stressed: true,
      stressLevel,
      primaryIssue: topDisease.name
    };
  } catch (error) {
    console.error('Quick stress check failed:', error);
    return {
      stressed: false,
      stressLevel: 'none'
    };
  }
}
