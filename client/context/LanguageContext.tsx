/**
 * Language Context
 * Manages language preference for the app (English/Hindi)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (enText: string, hiText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'smartfarm_preferred_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
            return (stored === 'hi' ? 'hi' : 'en') as Language;
        } catch {
            return 'en';
        }
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        } catch (error) {
            console.error('[Language] Failed to save preference:', error);
        }
    };

    // Simple translation helper
    const t = (enText: string, hiText: string): string => {
        return language === 'hi' ? hiText : enText;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
