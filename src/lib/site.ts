/**
 * Business details used across the site, legal pages and structured data.
 * Update these before launch — anything marked TODO is a placeholder.
 */
export const SITE = {
  name: "Masion Web Studio",
  /** TODO: replace with your registered legal business name. */
  legalName: "Masion Web Studio",
  /** TODO: replace with your real contact address. */
  email: "hello@masionwebstudio.com",
  /** Optional mailing address shown in the privacy policy, e.g. "123 Main St, City, State, Country". */
  postalAddress: null as string | null,
  /** Optional governing-law jurisdiction for the terms, e.g. "the State of New York, USA". */
  governingLaw: null as string | null,
  hours: "Mon–Fri, 9–6 ET",
  /**
   * Legal pages show a "draft for review" notice while this is true.
   * Set to false only after the business owner and a qualified attorney approve them.
   */
  legalReviewPending: true,
  legalLastUpdated: "2026-10-27",
};

/** Absolute site origin, used for canonical URLs, sitemap and social previews. */
export function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  return (url || "http://localhost:3000").replace(/\/$/, "");
}
