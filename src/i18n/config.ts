/**
 * Supported languages. To add one: add it here, add a dictionary in
 * ./messages/<code>.ts (typed as Messages, so missing keys fail type-checking),
 * and register it in ./messages/index.ts.
 */
export const LOCALES = ["en", "zh", "es", "hi", "ar", "fr", "bn", "pt", "ru", "id"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that remembers an explicit language choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

type LocaleMeta = {
  /** Name of the language written in that language. */
  name: string;
  englishName: string;
  dir: "ltr" | "rtl";
  /** BCP 47 tag used for <html lang>, hreflang and Intl formatting. */
  tag: string;
  ogLocale: string;
  /** Stripe Checkout locale, or "auto" where Stripe has no translation. */
  stripe: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { name: "English", englishName: "English", dir: "ltr", tag: "en", ogLocale: "en_US", stripe: "en" },
  zh: { name: "简体中文", englishName: "Chinese (Simplified)", dir: "ltr", tag: "zh-Hans", ogLocale: "zh_CN", stripe: "zh" },
  es: { name: "Español", englishName: "Spanish", dir: "ltr", tag: "es", ogLocale: "es_ES", stripe: "es" },
  hi: { name: "हिन्दी", englishName: "Hindi", dir: "ltr", tag: "hi", ogLocale: "hi_IN", stripe: "auto" },
  ar: { name: "العربية", englishName: "Arabic", dir: "rtl", tag: "ar", ogLocale: "ar_AR", stripe: "auto" },
  fr: { name: "Français", englishName: "French", dir: "ltr", tag: "fr", ogLocale: "fr_FR", stripe: "fr" },
  bn: { name: "বাংলা", englishName: "Bengali", dir: "ltr", tag: "bn", ogLocale: "bn_BD", stripe: "auto" },
  pt: { name: "Português", englishName: "Portuguese", dir: "ltr", tag: "pt-BR", ogLocale: "pt_BR", stripe: "pt-BR" },
  ru: { name: "Русский", englishName: "Russian", dir: "ltr", tag: "ru", ogLocale: "ru_RU", stripe: "ru" },
  id: { name: "Bahasa Indonesia", englishName: "Indonesian", dir: "ltr", tag: "id", ogLocale: "id_ID", stripe: "id" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Prefixes an internal path with the locale. English uses unprefixed URLs.
 * "/pricing#faq" -> "/es/pricing#faq"; "/" -> "/es".
 */
export function localizePath(locale: Locale, href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (locale === DEFAULT_LOCALE) return href;
  const match = href.match(/^([^?#]*)(.*)$/)!;
  const path = match[1] === "/" ? "" : match[1];
  return `/${locale}${path}${match[2]}`;
}

/** Splits "/es/pricing" into { locale: "es", path: "/pricing" }. */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if (isLocale(first) && first !== DEFAULT_LOCALE) {
    return { locale: first, path: `/${rest.join("/")}` };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}
