/**
 * Farm Mapping localStorage Utility
 * Handles all localStorage operations for farm field mapping
 */

export interface WaterSource {
  id: string;
  name: string;
  type: 'river' | 'lake' | 'pond' | 'reservoir' | 'canal' | 'stream' | 'well' | 'water_tower' | 'spring' | 'waterway';
  coordinates: [number, number]; // [lat, lng]
  source: 'osm' | 'manual';
  osmId?: string;
  capacity?: number; // liters per hour (for manual sources)
  quality?: 'good' | 'average' | 'poor';
}

export interface SectionData {
  id: string;
  name: string;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  area: number;
  cropType: string;
  soilType: string;
  irrigationType: string;
  color: string;
  createdAt: string;
  nearestWaterSource?: {
    id: string;
    distance: number; // in meters
  };
}

export interface FarmMappingData {
  farmId: string;
  farmBoundary: {
    type: 'Polygon';
    coordinates: number[][][];
    area: number;
    center: [number, number];
  } | null;
  sections: SectionData[];
  waterSources: WaterSource[];
  waterSourcesLastFetched?: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'farm_field_mapping';

// Color palette for sections
const SECTION_COLORS = [
  '#10b981', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Deep Orange
];

/**
 * Get color for section based on index
 */
export const getSectionColor = (index: number): string => {
  return SECTION_COLORS[index % SECTION_COLORS.length];
};

/**
 * Validate localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Get farm mapping data from localStorage
 */
export const getFarmMapping = (): FarmMappingData | null => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available');
    return null;
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return null;
    }

    const parsed = JSON.parse(data);
    
    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      console.error('Invalid farm mapping data structure');
      return null;
    }

    return parsed as FarmMappingData;
  } catch (error) {
    console.error('Error reading farm mapping from localStorage:', error);
    return null;
  }
};

/**
 * Save complete farm mapping data
 */
export const saveFarmMapping = (data: FarmMappingData): boolean => {
  if (!isLocalStorageAvailable()) {
    console.error('localStorage is not available');
    return false;
  }

  try {
    const dataToSave = {
      ...data,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    return true;
  } catch (error) {
    console.error('Error saving farm mapping to localStorage:', error);
    
    // Check if quota exceeded
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded');
    }
    
    return false;
  }
};

/**
 * Initialize farm mapping with default structure
 */
export const initializeFarmMapping = (farmId: string): FarmMappingData => {
  const data: FarmMappingData = {
    farmId,
    farmBoundary: null,
    sections: [],
    waterSources: [],
    lastUpdated: new Date().toISOString(),
  };

  saveFarmMapping(data);
  return data;
};

/**
 * Save farm boundary
 */
export const saveFarmBoundary = (
  farmId: string,
  coordinates: number[][][],
  area: number,
  center: [number, number]
): boolean => {
  const currentData = getFarmMapping() || initializeFarmMapping(farmId);

  currentData.farmBoundary = {
    type: 'Polygon',
    coordinates,
    area,
    center,
  };

  return saveFarmMapping(currentData);
};

/**
 * Save or update a section
 */
export const saveSection = (farmId: string, section: SectionData): boolean => {
  const currentData = getFarmMapping() || initializeFarmMapping(farmId);

  const existingIndex = currentData.sections.findIndex(s => s.id === section.id);

  if (existingIndex >= 0) {
    // Update existing section
    currentData.sections[existingIndex] = section;
  } else {
    // Add new section with auto-assigned color
    const colorIndex = currentData.sections.length;
    const sectionWithColor = {
      ...section,
      color: section.color || getSectionColor(colorIndex),
      createdAt: section.createdAt || new Date().toISOString(),
    };
    currentData.sections.push(sectionWithColor);
  }

  return saveFarmMapping(currentData);
};

/**
 * Delete a section by ID
 */
export const deleteSection = (sectionId: string): boolean => {
  const currentData = getFarmMapping();
  
  if (!currentData) {
    return false;
  }

  currentData.sections = currentData.sections.filter(s => s.id !== sectionId);
  return saveFarmMapping(currentData);
};

/**
 * Get a specific section by ID
 */
export const getSection = (sectionId: string): SectionData | null => {
  const currentData = getFarmMapping();
  
  if (!currentData) {
    return null;
  }

  return currentData.sections.find(s => s.id === sectionId) || null;
};

/**
 * Get all sections
 */
export const getAllSections = (): SectionData[] => {
  const currentData = getFarmMapping();
  return currentData?.sections || [];
};

/**
 * Clear all farm mapping data
 */
export const clearFarmMapping = (): boolean => {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing farm mapping from localStorage:', error);
    return false;
  }
};

/**
 * Get summary statistics
 */
export const getFarmMappingStats = () => {
  const data = getFarmMapping();
  
  if (!data) {
    return {
      totalArea: 0,
      sectionsCount: 0,
      hasBoundary: false,
      cropDistribution: {},
    };
  }

  const cropDistribution: Record<string, number> = {};
  let totalSectionArea = 0;
  
  data.sections.forEach(section => {
    const crop = section.cropType || 'Unknown';
    cropDistribution[crop] = (cropDistribution[crop] || 0) + 1;
    totalSectionArea += section.area;
  });

  return {
    totalArea: totalSectionArea, // Sum of all section areas
    sectionsCount: data.sections.length,
    hasBoundary: !!data.farmBoundary,
    cropDistribution,
    lastUpdated: data.lastUpdated,
  };
};

/**
 * Export farm mapping data as JSON file
 */
export const exportFarmMappingData = (): void => {
  const data = getFarmMapping();
  
  if (!data) {
    console.error('No farm mapping data to export');
    return;
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `farm-mapping-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Import farm mapping data from JSON
 */
export const importFarmMappingData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData) as FarmMappingData;
    return saveFarmMapping(data);
  } catch (error) {
    console.error('Error importing farm mapping data:', error);
    return false;
  }
};

/**
 * Save water sources to farm mapping
 */
export const saveWaterSources = (waterSources: WaterSource[]): boolean => {
  const currentData = getFarmMapping();
  if (!currentData) return false;

  currentData.waterSources = waterSources;
  currentData.waterSourcesLastFetched = new Date().toISOString();
  
  return saveFarmMapping(currentData);
};

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Update section with nearest water source
 */
export const updateSectionWaterSource = (sectionId: string): boolean => {
  const currentData = getFarmMapping();
  if (!currentData) return false;

  const section = currentData.sections.find(s => s.id === sectionId);
  if (!section || currentData.waterSources.length === 0) return false;

  // Calculate section center
  let totalLat = 0;
  let totalLng = 0;
  const coords = section.geometry.coordinates[0];
  coords.forEach(coord => {
    totalLng += coord[0];
    totalLat += coord[1];
  });
  const sectionLat = totalLat / coords.length;
  const sectionLng = totalLng / coords.length;

  // Find nearest water source
  let nearestSource: { id: string; distance: number } | undefined;
  let minDistance = Infinity;

  currentData.waterSources.forEach(source => {
    const distance = calculateDistance(
      sectionLat,
      sectionLng,
      source.coordinates[0],
      source.coordinates[1]
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearestSource = { id: source.id, distance };
    }
  });

  if (nearestSource) {
    section.nearestWaterSource = nearestSource;
    return saveFarmMapping(currentData);
  }

  return false;
};

/**
 * Update all sections with nearest water sources
 */
export const updateAllSectionsWaterSources = (): boolean => {
  const currentData = getFarmMapping();
  if (!currentData) return false;

  currentData.sections.forEach(section => {
    updateSectionWaterSource(section.id);
  });

  return true;
};

// ============================================
// IRRIGATION PLANS STORAGE
// ============================================

const IRRIGATION_PLANS_KEY = 'farm_irrigation_plans';

export interface StoredIrrigationPlan {
  id: string;
  sectionId: string;
  sectionName: string;
  waterSourceId: string;
  waterSourceName: string;
  waterSourceType: string;
  method: string;
  distance: number;
  estimatedCost: {
    materials: number;
    labor: number;
    operational: number;
    total: number;
  };
  components: Array<{
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  recommendations: string[];
  warnings: string[];
  efficiency: number;
  suitabilityScore: number;
  implementationTime: string;
  waterRequirement: number;
  status: 'draft' | 'approved' | 'in-progress' | 'completed';
  createdAt: string;
}

/**
 * Get all irrigation plans
 */
export const getIrrigationPlans = (): StoredIrrigationPlan[] => {
  try {
    const data = localStorage.getItem(IRRIGATION_PLANS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

/**
 * Save an irrigation plan
 */
export const saveIrrigationPlan = (plan: StoredIrrigationPlan): boolean => {
  try {
    const plans = getIrrigationPlans();
    const existingIndex = plans.findIndex(p => p.id === plan.id);
    
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.push(plan);
    }
    
    localStorage.setItem(IRRIGATION_PLANS_KEY, JSON.stringify(plans));
    return true;
  } catch {
    return false;
  }
};

/**
 * Delete an irrigation plan
 */
export const deleteIrrigationPlan = (planId: string): boolean => {
  try {
    const plans = getIrrigationPlans();
    const filtered = plans.filter(p => p.id !== planId);
    localStorage.setItem(IRRIGATION_PLANS_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
};

/**
 * Update irrigation plan status
 */
export const updateIrrigationPlanStatus = (
  planId: string,
  status: StoredIrrigationPlan['status']
): boolean => {
  try {
    const plans = getIrrigationPlans();
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      plan.status = status;
      localStorage.setItem(IRRIGATION_PLANS_KEY, JSON.stringify(plans));
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Get irrigation plan by section ID
 */
export const getIrrigationPlanBySection = (sectionId: string): StoredIrrigationPlan | null => {
  const plans = getIrrigationPlans();
  return plans.find(p => p.sectionId === sectionId) || null;
};
