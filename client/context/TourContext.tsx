import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTourStatus, setTourCompleted, resetTour, resetAllTours } from '../hooks/useTourStorage';

export interface TourStep {
    target: string;
    title: string;
    content: string;
    route?: string;
    placement?: 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end' | 'center' | 'auto';
    disableBeacon?: boolean;
    spotlightClicks?: boolean;
}

interface TourContextType {
    // State
    isTourActive: boolean;
    currentTourId: string | null;
    currentStepIndex: number;

    // Actions
    startTour: (tourId: string) => void;
    endTour: () => void;
    skipTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (index: number) => void;

    // Persistence
    hasTourCompleted: (tourId: string) => boolean;
    markTourComplete: (tourId: string) => void;
    resetTourProgress: (tourId: string) => void;
    resetAllProgress: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

interface TourContextProviderProps {
    children: ReactNode;
}

export const TourContextProvider: React.FC<TourContextProviderProps> = ({ children }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentTourId, setCurrentTourId] = useState<string | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const startTour = useCallback((tourId: string) => {
        console.log('[Tour] Starting tour:', tourId);
        setCurrentTourId(tourId);
        setCurrentStepIndex(0);
        setIsTourActive(true);
    }, []);

    const endTour = useCallback(() => {
        console.log('[Tour] Ending tour:', currentTourId);
        if (currentTourId) {
            setTourCompleted(currentTourId);
        }
        setIsTourActive(false);
        setCurrentTourId(null);
        setCurrentStepIndex(0);
    }, [currentTourId]);

    const skipTour = useCallback(() => {
        console.log('[Tour] Skipping tour:', currentTourId);
        if (currentTourId) {
            setTourCompleted(currentTourId);
        }
        setIsTourActive(false);
        setCurrentTourId(null);
        setCurrentStepIndex(0);
    }, [currentTourId]);

    const nextStep = useCallback(() => {
        setCurrentStepIndex(prev => prev + 1);
    }, []);

    const prevStep = useCallback(() => {
        setCurrentStepIndex(prev => Math.max(0, prev - 1));
    }, []);

    const goToStep = useCallback((index: number) => {
        setCurrentStepIndex(index);
    }, []);

    const hasTourCompleted = useCallback((tourId: string) => {
        return getTourStatus(tourId);
    }, []);

    const markTourComplete = useCallback((tourId: string) => {
        setTourCompleted(tourId);
    }, []);

    const resetTourProgress = useCallback((tourId: string) => {
        resetTour(tourId);
    }, []);

    const resetAllProgress = useCallback(() => {
        resetAllTours();
    }, []);

    const value: TourContextType = {
        isTourActive,
        currentTourId,
        currentStepIndex,
        startTour,
        endTour,
        skipTour,
        nextStep,
        prevStep,
        goToStep,
        hasTourCompleted,
        markTourComplete,
        resetTourProgress,
        resetAllProgress,
    };

    return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export const useTour = (): TourContextType => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within TourContextProvider');
    }
    return context;
};
