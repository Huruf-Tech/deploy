import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import TranslationAR from "./src/locales/ar/translation.json";
import TranslationEN from "./src/locales/en/translation.json";

i18n
  // https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    nonExplicitSupportedLngs: true,
    debug: false,
    // Keys are plain English sentences, which contain "." and ":".
    keySeparator: false,
    nsSeparator: false,
    // English strings are used as keys; the "en" file only adds plural forms.
    resources: {
      en: { translation: TranslationEN },
      ar: { translation: TranslationAR },
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
