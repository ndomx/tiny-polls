export const locales = ["en", "es"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";
export const localeCookieName = "tiny_polls_locale";

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getLocale(value: FormDataEntryValue | string | null): Locale {
  return typeof value === "string" && isLocale(value) ? value : defaultLocale;
}

export function withLocale(locale: Locale, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function stripLocale(path: string) {
  const segments = path.split("/");
  const maybeLocale = segments[1] || "";

  if (!isLocale(maybeLocale)) {
    return path;
  }

  const stripped = `/${segments.slice(2).join("/")}`;
  return stripped === "/" ? "/" : stripped.replace(/\/$/, "");
}
