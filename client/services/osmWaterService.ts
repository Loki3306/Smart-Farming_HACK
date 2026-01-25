/**
 * OSM Water Source Service
 * Fetches water sources from OpenStreetMap using Overpass API
 */

import { WaterSource } from '../utils/farmMappingStorage';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Cache timeout: 24 hours
const CACHE_TIMEOUT_MS = 24 * 60 * 60 * 1000;

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    water?: string;
    natural?: string;
    waterway?: string;
    man_made?: string;
    amenity?: string;
  };
}

/**
 * Map OSM tags to our water source types
 */
const mapOsmToWaterType = (tags: any): WaterSource['type'] | null => {
  if (tags.natural === 'water') {
    if (tags.water === 'river') return 'river';
    if (tags.water === 'lake') return 'lake';
    if (tags.water === 'pond') return 'pond';
    if (tags.water === 'reservoir') return 'reservoir';
    if (tags.water === 'canal') return 'canal';
    return 'pond'; // default for natural water
  }
  if (tags.waterway === 'river') return 'river';
  if (tags.waterway === 'stream') return 'stream';
  if (tags.waterway === 'canal') return 'canal';
  if (tags.waterway) return 'waterway';
  if (tags.man_made === 'water_tower') return 'water_tower';
  if (tags.man_made === 'water_well' || tags.amenity === 'water_point') return 'well';
  if (tags.natural === 'spring') return 'spring';
  
  return null;
};

/**
 * Generate a readable name for a water source
 */
const generateWaterSourceName = (element: OverpassElement, type: string): string => {
  if (element.tags?.name) {
    return element.tags.name;
  }
  
  const typeNames: Record<string, string> = {
    river: 'River',
    lake: 'Lake',
    pond: 'Pond',
    reservoir: 'Reservoir',
    canal: 'Canal',
    stream: 'Stream',
    well: 'Well',
    water_tower: 'Water Tower',
    spring: 'Spring',
    waterway: 'Waterway',
  };
  
  return typeNames[type] || 'Water Source';
};

/**
 * Fetch water sources from OSM within a bounding box
 * @param bounds { minLat, minLon, maxLat, maxLon }
 * @param radiusKm - radius in kilometers to search around center
 */
export const fetchWaterSourcesFromOSM = async (
  centerLat: number,
  centerLon: number,
  radiusKm: number = 2
): Promise<WaterSource[]> => {
  try {
    // Calculate bounding box from center and radius
    const latOffset = radiusKm / 111; // rough conversion: 1 degree lat ≈ 111 km
    const lonOffset = radiusKm / (111 * Math.cos((centerLat * Math.PI) / 180));
    
    const bounds = {
      minLat: centerLat - latOffset,
      maxLat: centerLat + latOffset,
      minLon: centerLon - lonOffset,
      maxLon: centerLon + lonOffset,
    };

    // Overpass QL query to find water sources
    const query = `
      [out:json][timeout:25];
      (
        // Natural water bodies (ponds, lakes, rivers)
        way["natural"="water"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        relation["natural"="water"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        
        // Waterways (rivers, streams, canals)
        way["waterway"~"river|stream|canal"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        
        // Wells and water points
        node["man_made"="water_well"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        node["amenity"="water_point"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        
        // Springs
        node["natural"="spring"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
        
        // Water towers
        node["man_made"="water_tower"](${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
      );
      out center;
    `;

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data = await response.json();
    const waterSources: WaterSource[] = [];

    data.elements.forEach((element: OverpassElement) => {
      const waterType = mapOsmToWaterType(element.tags || {});
      if (!waterType) return;

      let lat: number;
      let lon: number;

      if (element.lat && element.lon) {
        lat = element.lat;
        lon = element.lon;
      } else if (element.center) {
        lat = element.center.lat;
        lon = element.center.lon;
      } else {
        return; // Skip if no coordinates
      }

      waterSources.push({
        id: `osm-${element.id}`,
        name: generateWaterSourceName(element, waterType),
        type: waterType,
        coordinates: [lat, lon],
        source: 'osm',
        osmId: element.id.toString(),
      });
    });

    return waterSources;
  } catch (error) {
    console.error('Error fetching water sources from OSM:', error);
    throw error;
  }
};

/**
 * Check if cached water sources are still valid
 */
export const isCacheValid = (lastFetched: string | undefined): boolean => {
  if (!lastFetched) return false;
  
  const fetchedTime = new Date(lastFetched).getTime();
  const now = Date.now();
  
  return (now - fetchedTime) < CACHE_TIMEOUT_MS;
};
