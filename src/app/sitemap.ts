import type { MetadataRoute } from "next";
import { LOCALES, localizePath } from "@/i18n/config";
import { languageAlternates } from "@/i18n/metadata";
import { PROJECTS } from "@/lib/projects";
import { siteOrigin } from "@/lib/site";

/** Public, indexable pages. Demo sites, checkout and 404s are intentionally excluded. */
export const INDEXABLE_PATHS = [
  "/",
  "/work",
  ...PROJECTS.map((p) => `/work/${p.slug}`),
  "/services",
  "/pricing",
  "/process",
  "/about",
  "/start",
  "/privacy",
  "/terms",
  "/cookies",
  "/payment-agreement",
  "/accessibility",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const absolute = (languages: Record<string, string>) =>
    Object.fromEntries(Object.entries(languages).map(([k, v]) => [k, origin + v]));
  return INDEXABLE_PATHS.flatMap((path) =>
    LOCALES.map((locale) => ({
      url: origin + localizePath(locale, path),
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : path.startsWith("/work/") ? 0.6 : 0.8,
      alternates: { languages: absolute(languageAlternates(path)) },
    })),
  );
}
