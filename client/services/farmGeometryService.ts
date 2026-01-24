import axios from 'axios';
import { FARM_API_BASE_URL } from '../config';

// GeoJSON types
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][]; // Array of rings, first is exterior, rest are holes
}

// Farm Geometry types
export interface FarmGeometry {
  farm_id: string;
  boundary_geometry?: any;
  boundary_geojson?: GeoJSONPolygon;
  centroid_point?: any;
  centroid_geojson?: GeoJSONPoint;
  area_sq_meters?: number;
  area_acres?: number;
  has_geometry: boolean;
  geometry_updated_at?: string;
}

// Farm Section types
export interface FarmSection {
  section_id: string;
  farm_id: string;
  section_name: string;
  section_number?: number;
  display_color?: string;
  section_geometry?: any;
  section_geojson?: GeoJSONPolygon;
  centroid_point?: any;
  centroid_geojson?: GeoJSONPoint;
  area_sq_meters?: number;
  area_acres?: number;
  crop_type?: string;
  soil_type?: string;
  irrigation_type?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  last_analysis_date?: string;
  analysis_status?: string;
  health_score?: number;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFarmSection {
  section_name: string;
  section_number?: number;
  display_color?: string;
  section_geojson: GeoJSONPolygon;
  crop_type?: string;
  soil_type?: string;
  irrigation_type?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  notes?: string;
}

export interface UpdateFarmSection {
  section_name?: string;
  section_number?: number;
  display_color?: string;
  section_geojson?: GeoJSONPolygon;
  crop_type?: string;
  soil_type?: string;
  irrigation_type?: string;
  planting_date?: string;
  expected_harvest_date?: string;
  analysis_status?: string;
  health_score?: number;
  is_active?: boolean;
  notes?: string;
}

export interface FarmSectionsSummary {
  total_sections: number;
  total_area_sq_meters: number;
  active_sections: number;
  sections_with_crops: number;
  average_health_score?: number;
}

export interface BoundingBox {
  min_lon: number;
  min_lat: number;
  max_lon: number;
  max_lat: number;
}

class FarmGeometryService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${FARM_API_BASE_URL}/farms`;
  }

  // Farm Boundary Operations
  async updateFarmBoundary(farmId: string, boundaryGeoJSON: GeoJSONPolygon): Promise<FarmGeometry> {
    const response = await axios.put(`${this.baseURL}/${farmId}/geometry`, {
      boundary_geojson: boundaryGeoJSON,
    });
    return response.data;
  }

  async getFarmGeometry(farmId: string): Promise<FarmGeometry> {
    try {
      const response = await axios.get(`${this.baseURL}/${farmId}/geometry`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch farm geometry:', error);
      throw error;
    }
  }

  // Farm Section Operations
  async createSection(farmId: string, sectionData: CreateFarmSection): Promise<FarmSection> {
    const response = await axios.post(`${this.baseURL}/${farmId}/sections`, sectionData);
    return response.data;
  }

  async listSections(farmId: string, activeOnly: boolean = false): Promise<FarmSection[]> {
    try {
      const response = await axios.get(`${this.baseURL}/${farmId}/sections`, {
        params: { active_only: activeOnly },
      });
      // Ensure we always return an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('Failed to fetch sections:', error);
      // Return empty array on error to prevent crashes
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        return [];
      }
      throw error;
    }
  }

  async getSection(farmId: string, sectionId: string): Promise<FarmSection> {
    const response = await axios.get(`${this.baseURL}/${farmId}/sections/${sectionId}`);
    return response.data;
  }

  async updateSection(
    farmId: string,
    sectionId: string,
    updateData: UpdateFarmSection
  ): Promise<FarmSection> {
    const response = await axios.patch(`${this.baseURL}/${farmId}/sections/${sectionId}`, updateData);
    return response.data;
  }

  async deleteSection(farmId: string, sectionId: string): Promise<void> {
    await axios.delete(`${this.baseURL}/${farmId}/sections/${sectionId}`);
  }

  async bulkCreateSections(
    farmId: string,
    sections: CreateFarmSection[]
  ): Promise<{ created: FarmSection[]; errors: any[] }> {
    const response = await axios.post(`${this.baseURL}/${farmId}/sections/bulk`, {
      sections,
    });
    return response.data;
  }

  // Section Summary and Analysis
  async getSectionsSummary(farmId: string): Promise<FarmSectionsSummary> {
    const response = await axios.get(`${this.baseURL}/${farmId}/sections-summary`);
    return response.data;
  }

  async checkPointInFarm(farmId: string, longitude: number, latitude: number): Promise<boolean> {
    const response = await axios.post(`${this.baseURL}/${farmId}/point-in-farm`, {
      longitude,
      latitude,
    });
    return response.data.is_within_farm;
  }

  async getNeighboringSections(
    farmId: string,
    sectionId: string
  ): Promise<Array<{ section_id: string; section_name: string; crop_type?: string; shared_boundary_length_meters: number }>> {
    const response = await axios.get(`${this.baseURL}/${farmId}/sections/${sectionId}/neighbors`);
    return response.data;
  }

  // Spatial Queries
  async findFarmsInBoundingBox(bbox: BoundingBox): Promise<FarmGeometry[]> {
    const response = await axios.post(`${FARM_API_BASE_URL}/spatial-query/farms-in-bbox`, bbox);
    return response.data;
  }

  async findSectionsInBoundingBox(bbox: BoundingBox, farmId?: string): Promise<FarmSection[]> {
    const response = await axios.post(`${FARM_API_BASE_URL}/spatial-query/sections-in-bbox`, {
      ...bbox,
      farm_id: farmId,
    });
    return response.data;
  }
}

export const farmGeometryService = new FarmGeometryService();
