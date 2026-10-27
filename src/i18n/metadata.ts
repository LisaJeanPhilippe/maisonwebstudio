import type { Metadata } from "next";
import { siteOrigin } from "@/lib/site";
import { DEFAULT_LOCALE, LOCALES, LOCALE_META, localizePath, type Locale } from "./config";

/** hreflang alternates for a path, including x-default (English). */
export function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[LOCALE_META[l].tag] = localizePath(l, path);
  languages["x-default"] = localizePath(DEFAULT_LOCALE, path);
  return languages;
}

/** Title, description, canonical, hreflang and social previews for a page. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  absoluteTitle = false,
  noindex = false,
}: {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
  absoluteTitle?: boolean;
  noindex?: boolean;
}): Metadata {
  const url = localizePath(locale, path);
  const image = { url: "/og.png", width: 1200, height: 630, alt: "Masion Web Studio — Beautiful websites built for businesses ready to grow." };
  return {
    metadataBase: new URL(siteOrigin()),
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: noindex ? undefined : { canonical: url, languages: languageAlternates(path) },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: "Masion Web Studio",
      title,
      description,
      url,
      locale: LOCALE_META[locale].ogLocale,
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => LOCALE_META[l].ogLocale),
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}
