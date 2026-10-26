/**
 * Single source of truth for packages, add-ons and pricing.
 * Used by the UI and re-used on the server so totals can never be
 * tampered with from the client.
 */

export type PackageId = "starter" | "business" | "premium";

export type Package = {
  id: PackageId;
  name: string;
  price: number; // USD, whole dollars
  tagline: string;
  pageLimit: number;
  revisions: number;
  timeline: string;
  timelineDays: number;
  highlight?: string;
  features: string[];
};

export const PACKAGES: Package[] = [
  {
    id: "starter",
    name: "Starter Website",
    price: 499,
    tagline: "A polished, professional presence for new and growing businesses.",
    pageLimit: 3,
    revisions: 1,
    timeline: "7–10 days",
    timelineDays: 10,
    features: [
      "Up to 3 pages",
      "Custom design",
      "Mobile responsiveness",
      "Contact form",
      "Social links",
      "Basic SEO",
      "SSL / security setup",
      "One revision round",
      "Launch assistance",
    ],
  },
  {
    id: "business",
    name: "Business Website",
    price: 899,
    tagline: "Everything an established business needs to attract and convert.",
    pageLimit: 7,
    revisions: 2,
    timeline: "2–3 weeks",
    timelineDays: 21,
    highlight: "Most chosen",
    features: [
      "Up to 7 pages",
      "Custom design",
      "Mobile responsiveness",
      "Contact forms",
      "Gallery",
      "Google Maps",
      "Social integrations",
      "SEO",
      "Analytics",
      "Booking integration",
      "Two revision rounds",
      "Launch assistance",
    ],
  },
  {
    id: "premium",
    name: "Premium Website",
    price: 1499,
    tagline: "A fully considered, editorial-grade site for brands that lead.",
    pageLimit: 12,
    revisions: 3,
    timeline: "3–4 weeks",
    timelineDays: 28,
    features: [
      "Up to 12 pages",
      "Premium design",
      "Advanced sections",
      "Animations",
      "Forms",
      "Galleries",
      "Booking",
      "Newsletter integration",
      "SEO",
      "Analytics",
      "Blog setup",
      "Three revision rounds",
      "Priority support",
    ],
  },
];

/** Feature matrix used by the package comparison table. */
export const COMPARISON: { label: string; values: Record<PackageId, boolean | string> }[] = [
  { label: "Pages included", values: { starter: "Up to 3", business: "Up to 7", premium: "Up to 12" } },
  { label: "Design", values: { starter: "Custom", business: "Custom", premium: "Premium" } },
  { label: "Revision rounds", values: { starter: "1", business: "2", premium: "3" } },
  { label: "Typical timeline", values: { starter: "7–10 days", business: "2–3 weeks", premium: "3–4 weeks" } },
  { label: "Mobile responsiveness", values: { starter: true, business: true, premium: true } },
  { label: "Contact forms", values: { starter: true, business: true, premium: true } },
  { label: "SSL / security setup", values: { starter: true, business: true, premium: true } },
  { label: "SEO", values: { starter: "Basic", business: "Standard", premium: "Standard" } },
  { label: "Gallery", values: { starter: false, business: true, premium: true } },
  { label: "Google Maps", values: { starter: false, business: true, premium: true } },
  { label: "Analytics", values: { starter: false, business: true, premium: true } },
  { label: "Booking integration", values: { starter: false, business: true, premium: true } },
  { label: "Advanced sections & animation", values: { starter: false, business: false, premium: true } },
  { label: "Newsletter integration", values: { starter: false, business: false, premium: true } },
  { label: "Blog setup", values: { starter: false, business: false, premium: true } },
  { label: "Priority support", values: { starter: false, business: false, premium: true } },
  { label: "Launch assistance", values: { starter: true, business: true, premium: true } },
];

export type AddOnId =
  | "extra-pages"
  | "copywriting"
  | "logo"
  | "ecommerce"
  | "booking"
  | "newsletter"
  | "blog"
  | "seo-plus"
  | "google-business"
  | "care-plan"
  | "rush";

export type AddOn = {
  id: AddOnId;
  name: string;
  description: string;
  price: number;
  /** "unit" add-ons accept a quantity (e.g. extra pages). */
  kind: "flat" | "unit";
  unitLabel?: string;
  maxQuantity?: number;
  /** Packages where the add-on is already included and therefore hidden. */
  includedIn?: PackageId[];
};

export const ADD_ONS: AddOn[] = [
  {
    id: "extra-pages",
    name: "Additional pages",
    description: "Extend your site beyond the pages included in your package.",
    price: 75,
    kind: "unit",
    unitLabel: "page",
    maxQuantity: 20,
  },
  {
    id: "copywriting",
    name: "Professional copywriting",
    description: "Clear, persuasive copy for every page, written in your brand voice.",
    price: 249,
    kind: "flat",
  },
  {
    id: "logo",
    name: "Logo & brand refresh",
    description: "A refined wordmark, color palette and type pairing for your business.",
    price: 299,
    kind: "flat",
  },
  {
    id: "ecommerce",
    name: "Online store",
    description: "Product catalog, cart and checkout for up to 25 products.",
    price: 399,
    kind: "flat",
  },
  {
    id: "booking",
    name: "Booking integration",
    description: "Online appointments connected to your calendar.",
    price: 149,
    kind: "flat",
    includedIn: ["business", "premium"],
  },
  {
    id: "newsletter",
    name: "Newsletter integration",
    description: "Signup forms connected to Mailchimp, Klaviyo or ConvertKit.",
    price: 99,
    kind: "flat",
    includedIn: ["premium"],
  },
  {
    id: "blog",
    name: "Blog setup",
    description: "A designed, easy-to-update blog with categories.",
    price: 149,
    kind: "flat",
    includedIn: ["premium"],
  },
  {
    id: "seo-plus",
    name: "Advanced SEO",
    description: "Keyword research, structured data and on-page optimization.",
    price: 199,
    kind: "flat",
  },
  {
    id: "google-business",
    name: "Google Business Profile",
    description: "Setup and optimization so customers find you on Maps.",
    price: 99,
    kind: "flat",
  },
  {
    id: "care-plan",
    name: "3-month care plan",
    description: "Updates, backups, monitoring and small edits after launch.",
    price: 179,
    kind: "flat",
  },
  {
    id: "rush",
    name: "Rush delivery",
    description: "Move to the front of the queue — launch in roughly half the time.",
    price: 249,
    kind: "flat",
  },
];

export const STYLE_DIRECTIONS = [
  { id: "minimal", name: "Minimal", description: "Quiet, spacious and precise." },
  { id: "editorial", name: "Editorial", description: "Magazine-like type and imagery." },
  { id: "warm", name: "Warm & organic", description: "Soft tones, inviting and human." },
  { id: "bold", name: "Bold & modern", description: "Confident type, strong contrast." },
] as const;

export type StyleDirection = (typeof STYLE_DIRECTIONS)[number]["id"];

export const INDUSTRIES = [
  "Beauty & skincare",
  "Restaurant & hospitality",
  "Wellness & fitness",
  "Professional services",
  "Interior & architecture",
  "Retail & e-commerce",
  "Health & medical",
  "Real estate",
  "Creative & media",
  "Other",
] as const;

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
    if (!raw) continue;
    const quantity =
      addOn.kind === "unit" ? Math.min(Math.max(Math.floor(raw), 0), addOn.maxQuantity ?? 1) : 1;
    if (quantity <= 0) continue;
    items.push({
      id: addOn.id,
      name: addOn.kind === "unit" ? `${addOn.name} (${quantity} ${addOn.unitLabel}${quantity > 1 ? "s" : ""})` : addOn.name,
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
export const PAYMENT_AGREEMENT_VERSION = "2026-10-26.3";

export function estimatedTimeline(packageId: PackageId, rush: boolean): string {
  const pkg = getPackage(packageId);
  if (!pkg) return "";
  if (!rush) return pkg.timeline;
  return { starter: "4–6 days", business: "8–12 days", premium: "12–16 days" }[packageId];
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
