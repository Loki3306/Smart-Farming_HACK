/**
 * Tour Storage Tests
 * Unit tests for tour completion persistence utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getTourStatus,
    setTourCompleted,
    resetTour,
    resetAllTours,
    getCompletedTours
} from './useTourStorage';

describe('Tour Storage Utilities', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    describe('getTourStatus', () => {
        it('returns false for tours that have not been completed', () => {
            expect(getTourStatus('main-tour')).toBe(false);
            expect(getTourStatus('farm-tour')).toBe(false);
        });

        it('returns true for completed tours', () => {
            localStorage.setItem('smartfarm_tour_main-tour_completed', 'true');
            expect(getTourStatus('main-tour')).toBe(true);
        });
    });

    describe('setTourCompleted', () => {
        it('marks a tour as completed in localStorage', () => {
            setTourCompleted('main-tour');
            expect(localStorage.getItem('smartfarm_tour_main-tour_completed')).toBe('true');
        });

        it('stores completion timestamp', () => {
            const before = new Date().toISOString();
            setTourCompleted('main-tour');
            const timestamp = localStorage.getItem('smartfarm_tour_main-tour_completed_at');
            expect(timestamp).toBeTruthy();
            expect(new Date(timestamp!).getTime()).toBeGreaterThan(0);
        });
    });

    describe('resetTour', () => {
        it('removes tour completion status', () => {
            setTourCompleted('main-tour');
            expect(getTourStatus('main-tour')).toBe(true);

            resetTour('main-tour');
            expect(getTourStatus('main-tour')).toBe(false);
        });

        it('removes completion timestamp', () => {
            setTourCompleted('main-tour');
            resetTour('main-tour');
            expect(localStorage.getItem('smartfarm_tour_main-tour_completed_at')).toBeNull();
        });
    });

    describe('resetAllTours', () => {
        it('resets all tour statuses', () => {
            setTourCompleted('main-tour');
            setTourCompleted('farm-tour');
            setTourCompleted('marketplace-tour');

            expect(getTourStatus('main-tour')).toBe(true);
            expect(getTourStatus('farm-tour')).toBe(true);

            resetAllTours();

            expect(getTourStatus('main-tour')).toBe(false);
            expect(getTourStatus('farm-tour')).toBe(false);
            expect(getTourStatus('marketplace-tour')).toBe(false);
        });

        it('does not affect other localStorage items', () => {
            localStorage.setItem('other_key', 'value');
            setTourCompleted('main-tour');

            resetAllTours();

            expect(localStorage.getItem('other_key')).toBe('value');
        });
    });

    describe('getCompletedTours', () => {
        it('returns empty array when no tours completed', () => {
            expect(getCompletedTours()).toEqual([]);
        });

        it('returns array of completed tour IDs', () => {
            setTourCompleted('main-tour');
            setTourCompleted('farm-tour');

            const completed = getCompletedTours();
            expect(completed).toContain('main-tour');
            expect(completed).toContain('farm-tour');
            expect(completed.length).toBe(2);
        });
    });
});
