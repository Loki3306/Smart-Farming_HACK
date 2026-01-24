/**
 * Regime Components Export
 * Central export point for all regime-related components
 */

export { default as RegimeList } from './RegimeList';
export { default as RegimeDetail } from './RegimeDetail';
export { default as RegimeForm } from './RegimeForm';
export { default as RegimeTimeline } from './RegimeTimeline';

export type {
  Regime,
  RegimeTask,
  CreateRegimeRequest,
  UpdateRegimeRequest,
} from '../../services/regimeService';
