/**
 * Notification Service
 * Handles browser push notifications, sounds, and vibration
 */

// Notification sound - base64 encoded short beep (to avoid external dependencies)
const NOTIFICATION_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRkKnMneq3owNpbk4J93CDGn96htLEGj9t5uO1G1+tRqRFnB9slsTmbH8rprWnjR6bBsY4Tc1Kh2dJLvwJ+Df5/2rZqMhqjyoJaHkLHqmpCKmrbmj4yDprPfh4yDrLfYhoqBs7nRfYx8ub7MdYd0vMHIbYBsvsbDbHhowcq/ZnFkxNK7YGpex9e3XWZb0Ny0VV9Q1t+vU1lR2eKpUF9Q2eCkT15W2d6fT19a1tuZT2Ff0dORTWRl0M2MTWxszsWFT3N1zb59UHp+zLV2U4KHy615VoqRyaN2WZKbx5hwXJqlxY5pX6Kuw4RjY6q3wXpkaLC/vnBoar3Hu2tsasLNuGZtZ8bRtGJvZMrWr15wYc7brFlwX9Hgpl12XNTkollxV9fnnlVzVdvqmFN1Ut7tklJ3T+HxjFF5S+P0hk97SOb3f096ROn6eU18P+z9ckx+PPD/a0x/OfP/ZEuANvb/XkqBNPn/V0mCMfz/UkmDLv//TEmEK///RkmFK///QUmHKf//PEqIJv//N0qJI///M0uKIP//L0uLHf//K0yMGv//J0yNGP//I02OFf//H06PEv//G06QEP//GE+RDf//FE+SCv//EU+TBw//DlCUBQ//C1CVAw//CFCWABb/BlGXABr/A1GYABz/AVKZACj+/1KaACz+/lObADL++VKLADI++FKLADg99FKKAD479FKKSD469FKJRz859FOJRz859VKIREE59lSIQz469lWHQz479laGQz479leGQj475liGQj875liGQj875liGQj875liGQj87';

let audioContext: AudioContext | null = null;
let audioBuffer: AudioBuffer | null = null;

/**
 * Check if browser supports notifications
 */
export function isPushSupported(): boolean {
    return 'Notification' in window;
}

/**
 * Check if browser supports vibration
 */
export function isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!isPushSupported()) return 'unsupported';
    return Notification.permission;
}

/**
 * Request permission for browser notifications
 */
export async function requestPushPermission(): Promise<boolean> {
    if (!isPushSupported()) {
        console.warn('[NotificationService] Push notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.warn('[NotificationService] Push notifications denied by user');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    } catch (error) {
        console.error('[NotificationService] Failed to request permission:', error);
        return false;
    }
}

/**
 * Show a browser push notification
 */
export function showPushNotification(
    title: string,
    options?: {
        body?: string;
        icon?: string;
        tag?: string;
        requireInteraction?: boolean;
        silent?: boolean;
    }
): Notification | null {
    if (!isPushSupported()) {
        console.warn('[NotificationService] Push notifications not supported');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.warn('[NotificationService] Push permission not granted');
        return null;
    }

    try {
        const notification = new Notification(title, {
            icon: '/logo.png', // Default app icon
            badge: '/logo.png',
            ...options,
        });

        // Auto-close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
    } catch (error) {
        console.error('[NotificationService] Failed to show notification:', error);
        return null;
    }
}

/**
 * Initialize audio context for notification sounds
 */
async function initAudio(): Promise<void> {
    if (audioContext && audioBuffer) return;

    try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Fetch and decode the notification sound
        const response = await fetch(NOTIFICATION_SOUND_URL);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
        console.error('[NotificationService] Failed to initialize audio:', error);
    }
}

/**
 * Play notification sound
 */
export async function playNotificationSound(): Promise<void> {
    try {
        await initAudio();

        if (!audioContext || !audioBuffer) {
            // Fallback: use a simple beep with oscillator
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            oscillator.stop(ctx.currentTime + 0.3);

            return;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    } catch (error) {
        console.error('[NotificationService] Failed to play sound:', error);
    }
}

/**
 * Vibrate the device (mobile only)
 */
export function vibrateDevice(pattern: number | number[] = [200, 100, 200]): boolean {
    if (!isVibrationSupported()) {
        console.warn('[NotificationService] Vibration not supported');
        return false;
    }

    try {
        return navigator.vibrate(pattern);
    } catch (error) {
        console.error('[NotificationService] Failed to vibrate:', error);
        return false;
    }
}

/**
 * Notification type mapping for filtering
 */
export interface NotificationTypeConfig {
    moisture: boolean;
    weather: boolean;
    pest: boolean;
    harvest: boolean;
}

/**
 * Check if a notification type is enabled based on settings
 */
export function isNotificationTypeEnabled(
    type: 'alert' | 'weather' | 'irrigation' | 'pest' | 'crop' | 'system',
    settings: NotificationTypeConfig
): boolean {
    switch (type) {
        case 'alert':
        case 'irrigation':
            return settings.moisture; // Moisture-related alerts
        case 'weather':
            return settings.weather;
        case 'pest':
            return settings.pest;
        case 'crop':
            return settings.harvest;
        case 'system':
            return true; // System notifications always shown
        default:
            return true;
    }
}

/**
 * Send a notification with all enabled features
 */
export async function sendNotification(
    title: string,
    message: string,
    options: {
        type?: 'alert' | 'weather' | 'irrigation' | 'pest' | 'crop' | 'system';
        enablePush?: boolean;
        enableSound?: boolean;
        enableVibration?: boolean;
    } = {}
): Promise<void> {
    const { enablePush = true, enableSound = true, enableVibration = true } = options;

    // Show browser notification
    if (enablePush) {
        showPushNotification(title, {
            body: message,
            tag: options.type || 'general',
            silent: !enableSound, // If sound is enabled separately, keep notification silent
        });
    }

    // Play sound
    if (enableSound) {
        await playNotificationSound();
    }

    // Vibrate
    if (enableVibration) {
        vibrateDevice();
    }
}
