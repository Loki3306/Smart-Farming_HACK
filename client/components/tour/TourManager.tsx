/**
 * TourManager Component
 * Main orchestration component for the onboarding tour system
 */

import React, { useEffect, useState, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '../../context/TourContext';
import { getTourConfig } from '../../config/tourConfig';
import FarmerGuide from './FarmerGuide';

interface TourManagerProps {
    tourId?: string;
    autoStart?: boolean;
    onComplete?: () => void;
}

/**
 * Wait for an element to appear in the DOM
 */
const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
    return new Promise((resolve) => {
        // Check if element already exists
        const element = document.querySelector(selector);
        if (element) {
            return resolve(element);
        }

        // Set up mutation observer to watch for element
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            const el = document.querySelector(selector);
            resolve(el);
        }, timeout);
    });
};

export const TourManager: React.FC<TourManagerProps> = ({
    tourId = 'main-tour',
    autoStart = true,
    onComplete,
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        isTourActive,
        startTour,
        endTour,
        skipTour,
        hasTourCompleted,
        currentStepIndex,
        goToStep,
    } = useTour();

    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [steps, setSteps] = useState<Step[]>([]);
    const [isWaiting, setIsWaiting] = useState(false);

    // Load tour configuration (reload when tour becomes active to get current language)
    useEffect(() => {
        const config = getTourConfig(tourId);
        if (config) {
            // Convert our TourStep format to Joyride Step format
            const joyrideSteps: Step[] = config.steps.map((step) => ({
                target: step.target,
                content: step.content,
                title: step.title,
                placement: step.placement || 'auto',
                disableBeacon: step.disableBeacon ?? true,
                spotlightClicks: step.spotlightClicks ?? false,
                styles: {
                    options: {
                        zIndex: 10000,
                    },
                },
            }));
            setSteps(joyrideSteps);
        }
    }, [tourId, isTourActive]);

    // Auto-start tour if conditions are met
    useEffect(() => {
        if (autoStart && steps.length > 0 && !hasTourCompleted(tourId) && !isTourActive) {
            // Small delay to ensure page is fully rendered
            const timer = setTimeout(() => {
                console.log('[TourManager] Auto-starting tour:', tourId);
                startTour(tourId);
                setRun(true);
            }, 800);

            return () => clearTimeout(timer);
        }
    }, [autoStart, steps, tourId, hasTourCompleted, isTourActive, startTour]);

    // Handle manual tour start from context
    useEffect(() => {
        if (isTourActive && !run) {
            setRun(true);
        }
    }, [isTourActive, run]);

    // Handle tour callback events
    const handleCallback = useCallback(async (data: CallBackProps) => {
        const { action, index, status, type } = data;

        console.log('[TourManager] Callback:', { action, index, status, type });

        // Handle tour completion (when Done/Finish is clicked on last step)
        if (status === STATUS.FINISHED) {
            console.log('[TourManager] Tour finished');
            setRun(false);
            setStepIndex(0);
            endTour();
            onComplete?.();
            return;
        }

        // Handle tour skip
        if (status === STATUS.SKIPPED) {
            console.log('[TourManager] Tour skipped');
            setRun(false);
            setStepIndex(0);
            skipTour();
            return;
        }

        // Handle close button (X button)
        if (action === ACTIONS.CLOSE) {
            console.log('[TourManager] Tour closed via X button');
            setRun(false);
            setStepIndex(0);
            skipTour();
            return;
        }

        // Handle step navigation
        if (type === EVENTS.STEP_AFTER) {
            // Check if this is the last step and user clicked Next/Done
            if (index === steps.length - 1 && action === ACTIONS.NEXT) {
                console.log('[TourManager] Last step completed, closing tour');
                setRun(false);
                setStepIndex(0);
                endTour();
                onComplete?.();
                return;
            }

            const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);

            if (nextIndex >= 0 && nextIndex < steps.length) {
                const nextStep = steps[nextIndex];
                const nextStepConfig = getTourConfig(tourId)?.steps[nextIndex];

                // Scroll to top for sidebar step (index 5 on main-tour) for better visibility
                if (tourId === 'main-tour' && nextIndex === 5) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Scroll to bottom for notifications list step for better visibility
                if (tourId === 'notifications-tour' && nextStep.target === '[data-tour-id="notif-list"]') {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    await new Promise(resolve => setTimeout(resolve, 400));
                }

                // Check if we need to navigate to a different route
                if (nextStepConfig?.route && location.pathname !== nextStepConfig.route) {
                    console.log('[TourManager] Navigating to:', nextStepConfig.route);
                    setRun(false);
                    setIsWaiting(true);

                    // Navigate to the new route
                    navigate(nextStepConfig.route);

                    // Wait for the target element to appear
                    await waitForElement(nextStep.target as string, 5000);

                    setIsWaiting(false);
                    setStepIndex(nextIndex);
                    goToStep(nextIndex);
                    setRun(true);
                } else {
                    // Same route, just update step
                    setStepIndex(nextIndex);
                    goToStep(nextIndex);
                }
            }
        }
    }, [steps, tourId, location.pathname, navigate, endTour, skipTour, goToStep, onComplete]);

    // Don't render if no steps or tour already completed
    if (steps.length === 0 || (!autoStart && !isTourActive)) {
        return null;
    }

    return (
        <>
            <Joyride
                steps={steps}
                stepIndex={stepIndex}
                run={run && !isWaiting}
                continuous
                showProgress
                showSkipButton
                hideCloseButton={false}
                disableOverlayClose
                disableScrolling={false}
                scrollToFirstStep
                scrollOffset={100}
                spotlightPadding={12}
                callback={handleCallback}
                tooltipComponent={FarmerGuide}
                floaterProps={{
                    disableAnimation: false,
                    hideArrow: true,
                    offset: 30,
                    styles: {
                        floater: {
                            filter: 'drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))',
                        },
                    },
                }}
                styles={{
                    options: {
                        primaryColor: '#10b981',
                        zIndex: 10000,
                        arrowColor: 'transparent',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    spotlight: {
                        borderRadius: 12,
                    },
                }}
            />

            {/* Loading indicator while waiting for navigation */}
            {isWaiting && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30">
                    <div className="bg-card rounded-xl p-6 shadow-xl flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-foreground font-medium">Loading next step...</span>
                    </div>
                </div>
            )}
        </>
    );
};

export default TourManager;
