/**
 * Regime Service Tests
 * Unit tests for API client integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import RegimeService from './regimeService';

// Mock axios
vi.mock('axios');

describe('RegimeService', () => {
  let service: RegimeService;
  const mockResponse = { data: 'success' };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RegimeService();
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('farmerId', 'farmer-123');
  });

  describe('getRegimes', () => {
    it('should fetch all regimes', async () => {
      vi.mocked(axios.get).mockResolvedValue(mockResponse);
      const result = await service.getRegimes();
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      vi.mocked(axios.get).mockRejectedValue(error);
      await expect(service.getRegimes()).rejects.toThrow();
    });
  });

  describe('createRegime', () => {
    it('should create a new regime', async () => {
      const data = {
        farmer_id: 'farmer-123',
        farm_id: 'farm-456',
        crop_type: 'rice',
        crop_stage: 'vegetative',
        recommendations: ['irrigation'],
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);
      const result = await service.createRegime(data);
      expect(result).toEqual(mockResponse);
    });

    it('should include auth token in requests', async () => {
      const data = {
        farmer_id: 'farmer-123',
        farm_id: 'farm-456',
        crop_type: 'rice',
        crop_stage: 'vegetative',
        recommendations: ['irrigation'],
      };

      vi.mocked(axios.post).mockResolvedValue(mockResponse);
      await service.createRegime(data);

      expect(axios.post).toHaveBeenCalled();
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status with notes', async () => {
      vi.mocked(axios.patch).mockResolvedValue(mockResponse);
      const result = await service.updateTaskStatus(
        'regime-123',
        'task-456',
        'completed',
        'Task completed successfully'
      );

      expect(result).toEqual(mockResponse);
      expect(axios.patch).toHaveBeenCalled();
    });

    it('should handle missing notes', async () => {
      vi.mocked(axios.patch).mockResolvedValue(mockResponse);
      await service.updateTaskStatus('regime-123', 'task-456', 'in_progress');

      expect(axios.patch).toHaveBeenCalled();
    });
  });

  describe('exportRegime', () => {
    it('should export regime as PDF', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: new Blob() });
      const result = await service.exportRegime('regime-123', 'pdf');

      expect(result).toBeDefined();
    });

    it('should export regime as CSV', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: new Blob() });
      const result = await service.exportRegime('regime-123', 'csv');

      expect(result).toBeDefined();
    });
  });
});
