/**
 * Regime Service
 * Frontend service to communicate with Regime System API
 * Handles all HTTP requests for regime CRUD operations
 */

import axios, { AxiosInstance } from 'axios';

interface CreateRegimeRequest {
  farmer_id: string;
  farm_id: string;
  crop_type: string;
  crop_stage: string;
  sowing_date?: string;
  recommendations: any[];
  regime_validity_days?: number;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
}

interface UpdateRegimeRequest {
  new_recommendations: any[];
  trigger_type: string;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
}

interface UpdateTaskStatusRequest {
  status: string;
  farmer_notes?: string;
}

class RegimeService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle errors globally
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        const message =
          error.response?.data?.detail ||
          error.message ||
          'An error occurred';
        throw new Error(message);
      }
    );
  }

  /**
   * Get all regimes for current user
   */
  async getRegimes() {
    return this.client.get('/api/regime');
  }

  /**
   * Get single regime with all tasks
   */
  async getRegime(regimeId: string) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.get('/api/regime/${regimeId}', {
      params: { farmer_id: farmerId },
    });
  }

  /**
   * Create new regime from recommendations
   */
  async createRegime(data: CreateRegimeRequest) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.post('/api/regime/generate', {
      ...data,
      farmer_id: farmerId,
    });
  }

  /**
   * Update regime with new recommendations
   */
  async updateRegime(regimeId: string, data: UpdateRegimeRequest) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.patch('/api/regime/${regimeId}/update', data, {
      params: { farmer_id: farmerId },
    });
  }

  /**
   * Archive regime
   */
  async deleteRegime(regimeId: string) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.delete('/api/regime/${regimeId}', {
      params: { farmer_id: farmerId },
    });
  }

  /**
   * Get regime version history
   */
  async getRegimeHistory(regimeId: string) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.get('/api/regime/${regimeId}/history', {
      params: { farmer_id: farmerId },
    });
  }

  /**
   * Get regime tasks with optional filters
   */
  async getRegimeTasks(regimeId: string, filters?: { status?: string; priority?: string }) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.get('/api/regime/${regimeId}/tasks', {
      params: {
        farmer_id: farmerId,
        ...filters,
      },
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    regimeId: string,
    taskId: string,
    status: string,
    notes?: string
  ) {
    const farmerId = localStorage.getItem('farmerId');
    return this.client.patch(
      '/api/regime/${regimeId}/task/${taskId}/status',
      {
        status,
        farmer_notes: notes,
      },
      {
        params: { farmer_id: farmerId },
      }
    );
  }

  /**
   * Export regime to PDF or CSV
   */
  async exportRegime(regimeId: string, format: 'pdf' | 'csv') {
    return this.client.post(
      '/api/regime/${regimeId}/export',
      {},
      {
        params: { format },
        responseType: 'blob',
      }
    );
  }

  /**
   * Check health of regime API
   */
  async health() {
    return this.client.get('/api/regime/health');
  }
}

// Export singleton instance
export const regimeService = new RegimeService();

export default RegimeService;
