/**
 * Settings Context
 * Global state management for user settings with database persistence
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    ReactNode,
} from 'react';
import {
    UserSettings,
    DEFAULT_SETTINGS,
    getUserSettings,
    updateUserSettings,
    clearCachedSettings,
} from '../services/SettingsService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { requestPushPermission, getPermissionStatus } from '../services/NotificationService';

interface SettingsContextType {
    settings: UserSettings;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Update methods
    updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
    updateNotificationSetting: (key: keyof UserSettings, value: boolean) => Promise<void>;
    updateAlertSetting: (key: keyof UserSettings, value: boolean) => Promise<void>;
    setLanguage: (language: string) => Promise<void>;
    setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;

    // Utility
    resetToDefaults: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

interface SettingsProviderProps {
    children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const { setLanguage: setAppLanguage, language: currentLanguage } = useLanguage();

    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Debounce timer for auto-save
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdatesRef = useRef<Partial<UserSettings>>({});

    // Load settings when user changes
    useEffect(() => {
        const loadSettings = async () => {
            if (!user?.id) {
                setSettings(DEFAULT_SETTINGS);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const userSettings = await getUserSettings(user.id);
                setSettings(userSettings);

                // Sync language with LanguageContext ONLY if they differ
                // This prevents overriding a language change that just happened
                if ((userSettings.language === 'hi' || userSettings.language === 'en' || userSettings.language === 'mr') &&
                    userSettings.language !== currentLanguage) {
                    setAppLanguage(userSettings.language as any);
                }
            } catch (err) {
                console.error('[SettingsContext] Failed to load settings:', err);
                setError('Failed to load settings');
                setSettings(DEFAULT_SETTINGS);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();

        // Cleanup on unmount or user change
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
        // Removed setAppLanguage dependency to avoid loop since it's stable but its usage might trigger re-renders
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Clear settings on logout
    useEffect(() => {
        if (!user) {
            clearCachedSettings();
            setSettings(DEFAULT_SETTINGS);
        }
    }, [user]);

    // Apply theme whenever it changes
    useEffect(() => {
        const applyTheme = () => {
            const root = document.documentElement;
            const theme = settings.theme;

            if (theme === 'dark') {
                root.classList.add('dark');
            } else if (theme === 'light') {
                root.classList.remove('dark');
            } else {
                // System = Auto (Time based: 7 PM - 6 AM is Dark)
                const hour = new Date().getHours();
                const isNight = hour >= 19 || hour < 6;

                if (isNight) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
        };

        applyTheme();

        // If system (auto), check every minute to switch automatically
        let intervalId: NodeJS.Timeout;
        if (settings.theme === 'system') {
            intervalId = setInterval(applyTheme, 60000); // Check every minute
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [settings.theme]);

    // Request push notification permission when enabled
    useEffect(() => {
        const handlePushPermission = async () => {
            if (settings.pushNotifications) {
                const status = getPermissionStatus();
                if (status !== 'granted' && status !== 'denied') {
                    const granted = await requestPushPermission();
                    if (!granted) {
                        // User declined - disable the setting
                        console.log('[SettingsContext] Push permission not granted');
                    }
                }
            }
        };

        handlePushPermission();
    }, [settings.pushNotifications]);

    /**
     * Debounced save to database
     */
    const debouncedSave = useCallback(async () => {
        if (!user?.id || Object.keys(pendingUpdatesRef.current).length === 0) {
            return;
        }

        setIsSaving(true);
        const toSave = { ...pendingUpdatesRef.current };
        pendingUpdatesRef.current = {};

        try {
            const result = await updateUserSettings(user.id, toSave);
            if (!result.success) {
                setError(result.error || 'Failed to save settings');
            }
        } catch (err) {
            console.error('[SettingsContext] Save error:', err);
            setError('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    }, [user?.id]);

    /**
     * Update settings with debounced persistence
     */
    const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
        // Optimistic update
        setSettings(prev => ({ ...prev, ...updates }));

        // Accumulate pending updates
        pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

        // Clear existing timer
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Set new debounce timer (500ms)
        saveTimeoutRef.current = setTimeout(debouncedSave, 500);
    }, [debouncedSave]);

    /**
     * Update a notification setting
     */
    const updateNotificationSetting = useCallback(async (key: keyof UserSettings, value: boolean) => {
        await updateSettings({ [key]: value });
    }, [updateSettings]);

    /**
     * Update an alert setting
     */
    const updateAlertSetting = useCallback(async (key: keyof UserSettings, value: boolean) => {
        await updateSettings({ [key]: value });
    }, [updateSettings]);

    /**
     * Set language preference
     */
    const setLanguagePreference = useCallback(async (language: string) => {
        await updateSettings({ language });

        // Also update the global LanguageContext
        if (language === 'hi' || language === 'en' || language === 'mr') {
            setAppLanguage(language as any);
        }
    }, [updateSettings, setAppLanguage]);

    /**
     * Set theme preference
     */
    const setTheme = useCallback(async (theme: 'light' | 'dark' | 'system') => {
        await updateSettings({ theme });

        // Apply theme to document (basic implementation)
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else if (theme === 'light') {
            root.classList.remove('dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    }, [updateSettings]);

    /**
     * Reset all settings to defaults
     */
    const resetToDefaults = useCallback(async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            await updateUserSettings(user.id, DEFAULT_SETTINGS);
            setSettings(DEFAULT_SETTINGS);
            setAppLanguage('en');
        } catch (err) {
            setError('Failed to reset settings');
        } finally {
            setIsSaving(false);
        }
    }, [user?.id, setAppLanguage]);

    const value: SettingsContextType = {
        settings,
        isLoading,
        isSaving,
        error,
        updateSettings,
        updateNotificationSetting,
        updateAlertSetting,
        setLanguage: setLanguagePreference,
        setTheme,
        resetToDefaults,
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};
