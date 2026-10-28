import type { Page } from "@playwright/test";

export const LOCALES = ["en", "zh", "es", "hi", "ar", "fr", "bn", "pt", "ru", "id"] as const;
export const PAGES = ["/", "/work", "/work/aurelia-skin", "/services", "/process", "/about", "/pricing", "/start"];
export const LEGAL = ["/privacy", "/terms", "/cookies", "/payment-agreement", "/accessibility"];
export const url = (locale: string, path: string) => (locale === "en" ? path : `/${locale}${path === "/" ? "" : path}`);

/** Collects uncaught errors and console errors on a page. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/status of (404|503)/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}
