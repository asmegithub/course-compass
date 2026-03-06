import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import am from './locales/am.json';
import om from './locales/om.json';
import gez from './locales/gez.json';

export const supportedLngs = ['en', 'am', 'om', 'gez'] as const;
export type Locale = (typeof supportedLngs)[number];

export const languageNames: Record<Locale, string> = {
  en: 'English',
  am: 'አማርኛ',
  om: 'Oromoo',
  gez: 'ግዕዝ',
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
      gez: { translation: gez },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
