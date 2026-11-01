/**
 * Single source of truth for packages, add-ons and pricing.
 * Used by the UI and re-used on the server so totals can never be
 * tampered with from the client.
 *
 * `name` fields are the English names used on Stripe receipts and in the
 * studio's internal emails. Customer-facing text (names, descriptions,
 * feature lists, timelines) lives in the translation dictionaries.
 */

export type PackageId = "starter" | "business" | "premium";

export type Package = {
  id: PackageId;
  name: string;
  price: number; // USD, whole dollars
  pageLimit: number;
  revisions: number;
  /** Shown with a subtle "Most chosen" label. */
  featured?: boolean;
};

export const PACKAGES: Package[] = [
  { id: "starter", name: "Starter Website", price: 499, pageLimit: 3, revisions: 1 },
  { id: "business", name: "Business Website", price: 899, pageLimit: 7, revisions: 2, featured: true },
  { id: "premium", name: "Premium Website", price: 1499, pageLimit: 12, revisions: 3 },
];

/** Values are either included/not included, or a key into the `compare.values` dictionary. */
export type CompareValue = boolean | "upTo3" | "upTo7" | "upTo12" | "custom" | "premium" | "basic" | "standard" | "one" | "two" | "three" | "timeline";

export const COMPARISON: { key: string; values: Record<PackageId, CompareValue> }[] = [
  { key: "pages", values: { starter: "upTo3", business: "upTo7", premium: "upTo12" } },
  { key: "design", values: { starter: "custom", business: "custom", premium: "premium" } },
  { key: "revisions", values: { starter: "one", business: "two", premium: "three" } },
  { key: "timeline", values: { starter: "timeline", business: "timeline", premium: "timeline" } },
  { key: "mobile", values: { starter: true, business: true, premium: true } },
  { key: "forms", values: { starter: true, business: true, premium: true } },
  { key: "ssl", values: { starter: true, business: true, premium: true } },
  { key: "seo", values: { starter: "basic", business: "standard", premium: "standard" } },
  { key: "gallery", values: { starter: false, business: true, premium: true } },
  { key: "maps", values: { starter: false, business: true, premium: true } },
  { key: "analytics", values: { starter: false, business: true, premium: true } },
  { key: "booking", values: { starter: false, business: true, premium: true } },
  { key: "advanced", values: { starter: false, business: false, premium: true } },
  { key: "newsletter", values: { starter: false, business: false, premium: true } },
  { key: "blog", values: { starter: false, business: false, premium: true } },
  { key: "priority", values: { starter: false, business: false, premium: true } },
  { key: "launch", values: { starter: true, business: true, premium: true } },
];

export const ADD_ON_IDS = [
  "extra-pages",
  "copywriting",
  "logo",
  "ecommerce",
  "booking",
  "newsletter",
  "blog",
  "seo-plus",
  "google-business",
  "care-plan",
  "rush",
] as const;

export type AddOnId = (typeof ADD_ON_IDS)[number];

export type AddOn = {
  id: AddOnId;
  name: string;
  price: number;
  /** "unit" add-ons accept a quantity (e.g. extra pages). */
  kind: "flat" | "unit";
  maxQuantity?: number;
  /** Packages where the add-on is already included and therefore hidden. */
  includedIn?: PackageId[];
};

export const EXTRA_PAGE_PRICE = 75;

export const ADD_ONS: AddOn[] = [
  { id: "extra-pages", name: "Additional pages", price: EXTRA_PAGE_PRICE, kind: "unit", maxQuantity: 20 },
  { id: "copywriting", name: "Professional copywriting", price: 249, kind: "flat" },
  { id: "logo", name: "Logo & brand refresh", price: 299, kind: "flat" },
  { id: "ecommerce", name: "Online store", price: 399, kind: "flat" },
  { id: "booking", name: "Booking integration", price: 149, kind: "flat", includedIn: ["business", "premium"] },
  { id: "newsletter", name: "Newsletter integration", price: 99, kind: "flat", includedIn: ["premium"] },
  { id: "blog", name: "Blog setup", price: 149, kind: "flat", includedIn: ["premium"] },
  { id: "seo-plus", name: "Advanced SEO", price: 199, kind: "flat" },
  { id: "google-business", name: "Google Business Profile", price: 99, kind: "flat" },
  { id: "care-plan", name: "3-month care plan", price: 179, kind: "flat" },
  { id: "rush", name: "Rush delivery", price: 249, kind: "flat" },
];

export const STYLE_IDS = ["minimal", "editorial", "warm", "bold"] as const;
export type StyleDirection = (typeof STYLE_IDS)[number];

/** Industry ids, with the English label the studio sees in its emails. */
export const INDUSTRIES = {
  beauty: "Beauty & skincare",
  hospitality: "Restaurant & hospitality",
  wellness: "Wellness & fitness",
  professional: "Professional services",
  interiors: "Interior & architecture",
  retail: "Retail & e-commerce",
  health: "Health & medical",
  realEstate: "Real estate",
  creative: "Creative & media",
  other: "Other",
} as const;
export type IndustryId = keyof typeof INDUSTRIES;
export const INDUSTRY_IDS = Object.keys(INDUSTRIES) as IndustryId[];

export type SelectedAddOns = Partial<Record<AddOnId, number>>;

export type LineItem = { id: string; name: string; unitPrice: number; quantity: number; total: number };

export function getPackage(id: string | null | undefined): Package | undefined {
  return PACKAGES.find((p) => p.id === id);
}

export function getAddOn(id: string): AddOn | undefined {
  return ADD_ONS.find((a) => a.id === id);
}

export function availableAddOns(packageId: PackageId): AddOn[] {
  return ADD_ONS.filter((a) => !a.includedIn?.includes(packageId));
}

/** Builds priced line items. Ignores unknown, included or out-of-range add-ons. */
export function buildLineItems(packageId: PackageId, addOns: SelectedAddOns): LineItem[] {
  const pkg = getPackage(packageId);
  if (!pkg) return [];
  const items: LineItem[] = [
    { id: pkg.id, name: pkg.name, unitPrice: pkg.price, quantity: 1, total: pkg.price },
  ];
  for (const addOn of availableAddOns(packageId)) {
    const raw = addOns[addOn.id];
    if (!raw || !Number.isFinite(raw)) continue;
    const quantity =
      addOn.kind === "unit" ? Math.min(Math.max(Math.floor(raw), 0), addOn.maxQuantity ?? 1) : 1;
    if (quantity <= 0) continue;
    items.push({
      id: addOn.id,
      name: addOn.name,
      unitPrice: addOn.price,
      quantity,
      total: addOn.price * quantity,
    });
  }
  return items;
}

/** Every order is paid in full at checkout. */
export function computeTotals(packageId: PackageId, addOns: SelectedAddOns) {
  const items = buildLineItems(packageId, addOns);
  const total = items.reduce((sum, i) => sum + i.total, 0);
  return { items, total };
}

/** Bump when the payment agreement text changes; stored with every order. */
export const PAYMENT_AGREEMENT_VERSION = "2026-10-27";

/** Main call to action the customer wants on their website (questionnaire). */
export const CTA_IDS = ["book", "quote", "order", "shop", "consult", "contact", "call", "visit"] as const;
export type CtaId = (typeof CTA_IDS)[number];

/** Functionality the customer may need (questionnaire). */
export const FEATURE_IDS = [
  "contactForm", "booking", "payments", "deposits", "ecommerce", "catalog",
  "menu", "ordering", "newsletter", "maps", "social", "accounts",
] as const;
export type FeatureId = (typeof FEATURE_IDS)[number];
