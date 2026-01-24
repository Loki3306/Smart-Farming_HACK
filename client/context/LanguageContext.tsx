/**
 * Language Context
 * Manages language preference for the app (English/Hindi)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
    t: (enText: string, hiText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'smartfarm_preferred_language';

import i18n from '../lib/i18n';
import { useTranslation } from 'react-i18next';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Initialize from localStorage or fallback to i18n's detected language
    const [language, setLanguageState] = useState<Language>(() => {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
        return stored || (i18n.language as Language) || 'en';
    });

    // Ensure i18n is synced with state on mount
    useEffect(() => {
        if (language && i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, []);

    // Sync state when i18n language changes (e.g. from other components)
    useEffect(() => {
        const handleLanguageChanged = (lang: string) => {
            const newLang = lang as Language;
            setLanguageState(newLang);
            localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
        };

        i18n.on('languageChanged', handleLanguageChanged);
        return () => {
            i18n.off('languageChanged', handleLanguageChanged);
        };
    }, []);

    const setLanguage = (lang: Language) => {
        i18n.changeLanguage(lang);
    };

    const toggleLanguage = () => {
        const newLang = language === 'hi' ? 'en' : 'hi';
        setLanguage(newLang);
    };

    // Simple translation helper (Legacy support)
    const t = (enText: string, hiText: string): string => {
        if (language === 'mr') return hiText; // Fallback for Marathi to Hindi for legacy strings
        return language === 'hi' ? hiText : enText;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// Utility function to get language without hook (for non-component files)
export const getStoredLanguage = (): Language => {
    try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return stored === 'hi' ? 'hi' : 'en';
    } catch {
        return 'en';
    }
};

export const setStoredLanguage = (lang: Language): void => {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (error) {
        console.error('[Language] Failed to save preference:', error);
    }
};
