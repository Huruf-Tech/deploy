import React from "react";
import { useTranslation } from "react-i18next";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
] as const;

const RTL_LANGUAGES = new Set(["ar", "he", "fa", "ur"]);

export const getDirection = (language: string) =>
  RTL_LANGUAGES.has(language.split("-")[0]) ? "rtl" : "ltr";

/**
 * Keeps i18next, `<html lang>` and `<html dir>` in sync. A `?lng=` query param
 * takes precedence and is persisted by i18next's localStorage detector.
 */
export function useLanguage(override?: string | null) {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    if (override && override !== i18n.language)
      void i18n.changeLanguage(override).catch(console.error);
  }, [override, i18n]);

  const language = i18n.resolvedLanguage ?? i18n.language ?? "en";
  const direction = getDirection(language);

  React.useLayoutEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", language);
    html.setAttribute("dir", direction);
  }, [language, direction]);

  const changeLanguage = React.useCallback(
    (lng: string) => void i18n.changeLanguage(lng).catch(console.error),
    [i18n],
  );

  return { language, direction, changeLanguage } as const;
}
