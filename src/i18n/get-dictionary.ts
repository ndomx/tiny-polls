import "server-only";
import en from "@/i18n/dictionaries/en.json";
import es from "@/i18n/dictionaries/es.json";
import { defaultLocale, type Locale } from "@/i18n/locales";

const dictionaries = { en, es };

export type Dictionary = typeof en;
export type ErrorCode = keyof Dictionary["errors"];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries[defaultLocale];
}

export function formatMessage(
  message: string,
  values: Record<string, string | number>,
) {
  return Object.entries(values).reduce(
    (formatted, [key, value]) =>
      formatted.replaceAll(`{${key}}`, String(value)),
    message,
  );
}

export function getErrorMessage(dictionary: Dictionary, error: string) {
  return error in dictionary.errors
    ? dictionary.errors[error as ErrorCode]
    : error;
}
