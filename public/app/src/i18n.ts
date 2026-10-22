import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from "i18next-browser-languagedetector"

// Import core translations
import enCoreTranslations from "./core/locals/en/translation.json" with { type: "json" }
import arCoreTranslations from "./core/locals/ar/translation.json" with { type: "json" }

// Import local translations
import enTranslations from "./locals/en/translation.json" with { type: "json" }
import arTranslations from "./locals/ar/translation.json" with { type: "json" }

i18n
  .use(LanguageDetector)
  // passes i18n down to react-i18next
  .use(initReactI18next)
  .init({
    // Use local translation files
    resources: {
      en: {
        translation: {
          ...enCoreTranslations,
          ...enTranslations,
        },
      },
      ar: {
        translation: {
          ...arCoreTranslations,
          ...arTranslations,
        },
      },
    },
    //! Was `"ar"` with localStorage-only detection, so every first-time
    //! visitor started in Arabic whatever their browser said — and the
    //! comment claimed browser settings were consulted when they were not.
    //! An Arabic browser still resolves to Arabic via `navigator`.
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    detection: {
      // Stored preference first, then the browser's own language.
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "i18nextLng",
    },
    interpolation: {
      escapeValue: false, // react already safes from xss => https://www.i18next.com/translation-function/interpolation#unescape
    },
  })
  .catch(console.error)
export default i18n
