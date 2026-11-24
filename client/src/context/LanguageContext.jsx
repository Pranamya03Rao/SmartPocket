import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations.js';

const LanguageContext = createContext({
  language: 'kn',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
  isKn: true,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('smart_pocket_lang') || localStorage.getItem('shrama_mitra_lang') || 'kn';
  });

  const setLanguage = (lang) => {
    const validLang = lang === 'en' ? 'en' : 'kn';
    setLanguageState(validLang);
    localStorage.setItem('smart_pocket_lang', validLang);
    document.documentElement.lang = validLang;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'kn' ? 'en' : 'kn');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Helper function to retrieve nested translation keys with variable interpolation
   * e.g., t('dashboard.welcome', { name: 'Raju' })
   */
  const t = (path, vars = {}) => {
    if (!path) return '';
    const keys = path.split('.');
    let result = translations[language];

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        // Fallback to English if key missing in current language
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        result = fallback;
        break;
      }
    }

    if (typeof result !== 'string') {
      return path;
    }

    // Replace {{variable}} with actual values
    return Object.entries(vars).reduce((acc, [k, v]) => {
      return acc.replace(new RegExp(`{{${k}}}`, 'g'), String(v ?? ''));
    }, result);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isKn: language === 'kn',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

