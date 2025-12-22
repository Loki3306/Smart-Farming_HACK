/**
 * Tour Storage Utilities
 * Manages localStorage persistence for tour completion status
 */

const TOUR_PREFIX = 'smartfarm_tour_';

/**
 * Check if a specific tour has been completed
 */
export const getTourStatus = (tourId: string): boolean => {
    try {
        return localStorage.getItem(`${TOUR_PREFIX}${tourId}_completed`) === 'true';
    } catch {
        return false;
    }
};

/**
 * Mark a tour as completed
 */
export const setTourCompleted = (tourId: string): void => {
    try {
        localStorage.setItem(`${TOUR_PREFIX}${tourId}_completed`, 'true');
        localStorage.setItem(`${TOUR_PREFIX}${tourId}_completed_at`, new Date().toISOString());
    } catch (error) {
        console.error('[Tour] Failed to save tour completion:', error);
    }
};

/**
 * Reset a specific tour (for retaking)
 */
export const resetTour = (tourId: string): void => {
    try {
        localStorage.removeItem(`${TOUR_PREFIX}${tourId}_completed`);
        localStorage.removeItem(`${TOUR_PREFIX}${tourId}_completed_at`);
    } catch (error) {
        console.error('[Tour] Failed to reset tour:', error);
    }
};

/**
 * Reset all tours (for development/testing)
 */
export const resetAllTours = (): void => {
    try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(TOUR_PREFIX)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('[Tour] All tours reset');
    } catch (error) {
        console.error('[Tour] Failed to reset all tours:', error);
    }
};

/**
 * Get all completed tour IDs
 */
export const getCompletedTours = (): string[] => {
    const completed: string[] = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(TOUR_PREFIX) && key.endsWith('_completed')) {
                if (localStorage.getItem(key) === 'true') {
                    const tourId = key.replace(TOUR_PREFIX, '').replace('_completed', '');
                    completed.push(tourId);
                }
            }
        }
    } catch {
        // Ignore errors
    }
    return completed;
};
