import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'en',
        supportedLngs: ['en', 'hi', 'mr'],
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
            queryStringParams: { v: '1.0.1' },
        },

        ns: ['common', 'dashboard', 'farm', 'weather', 'learn', 'community', 'farmMapping', 'farmOverview', 'irrigationPlanner', 'regimes', 'marketplace'],
        defaultNS: 'common',

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag', 'cookie', 'queryString'],
            caches: ['localStorage'],
            lookupLocalStorage: 'smartfarm_preferred_language',
        },
    });

export default i18n;
