/**
 * Regime Service Exports
 * Type definitions and service instance
 */

export interface CreateRegimeRequest {
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

export interface UpdateRegimeRequest {
  new_recommendations: any[];
  trigger_type: string;
  temperature?: number;
  humidity?: number;
  rainfall?: number;
}

export interface UpdateTaskStatusRequest {
  status: string;
  farmer_notes?: string;
}

export interface RegimeTask {
  task_id: string;
  task_name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  priority: 'high' | 'medium' | 'low';
  timing_type: string;
  timing_value: number;
  timing_window_start?: string;
  timing_window_end?: string;
  confidence_score: number;
  farmer_notes?: string;
  quantity?: number;
}

export interface Regime {
  regime_id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  valid_from: string;
  valid_until: string;
  task_count: number;
  version: number;
  tasks: RegimeTask[];
}

export interface RegimeHistory {
  regime_id: string;
  current_version: number;
  versions: Array<{
    version_number: number;
    changes_summary: string;
    trigger_type: string;
    created_at: string;
    tasks_snapshot?: any;
  }>;
}

export class RegimeService {
  getRegimes(): Promise<Regime[]>;
  getRegime(regimeId: string): Promise<Regime>;
  createRegime(data: CreateRegimeRequest): Promise<Regime>;
  updateRegime(regimeId: string, data: UpdateRegimeRequest): Promise<Regime>;
  deleteRegime(regimeId: string): Promise<void>;
  getRegimeHistory(regimeId: string): Promise<RegimeHistory>;
  getRegimeTasks(
    regimeId: string,
    filters?: { status?: string; priority?: string }
  ): Promise<RegimeTask[]>;
  updateTaskStatus(
    regimeId: string,
    taskId: string,
    status: string,
    notes?: string
  ): Promise<any>;
  exportRegime(regimeId: string, format: 'pdf' | 'csv'): Promise<any>;
  health(): Promise<any>;
}

export declare const regimeService: RegimeService;

export default RegimeService;
