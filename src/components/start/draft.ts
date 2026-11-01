import type { z } from "zod";
import { getPackage, type CtaId, type FeatureId, type PackageId, type SelectedAddOns } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import {
  addOnsStepSchema,
  assetsStepSchema,
  briefStepSchema,
  configureStepSchema,
  fieldErrors,
  packageStepSchema,
  projectStepSchema,
  reviewStepSchema,
  type ErrorCode,
  type UploadedFile,
} from "@/lib/order-schema";

export type Draft = {
  packageId: PackageId | null;
  style: string;
  pages: string[];
  colorNotes: string;
  addOns: SelectedAddOns;
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  industry: string;
  currentWebsite: string;
  goals: string;
  audience: string;
  inspiration: string;
  hasDomain: "yes" | "no" | "unsure";
  launchDate: string;
  businessDescription: string;
  location: string;
  social: string;
  primaryCta: CtaId | "";
  desiredActions: string;
  personality: string;
  colorsAvoid: string;
  fonts: string;
  dislikes: string;
  designNotes: string;
  features: FeatureId[];
  featuresOther: string;
  toolLinks: string;
  aboutText: string;
  servicesText: string;
  productsText: string;
  pricingText: string;
  testimonialsText: string;
  faqText: string;
  contactInfo: string;
  languages: Locale[];
  files: UploadedFile[];
  assetNotes: string;
  acceptTerms: boolean;
  acceptPaymentAgreement: boolean;
  /** Honeypot — never shown to people, never persisted. */
  website2: string;
};

export const EMPTY_DRAFT: Draft = {
  packageId: null,
  style: "",
  pages: [],
  colorNotes: "",
  addOns: {},
  fullName: "",
  email: "",
  phone: "",
  businessName: "",
  industry: "",
  currentWebsite: "",
  goals: "",
  audience: "",
  inspiration: "",
  hasDomain: "unsure",
  launchDate: "",
  businessDescription: "",
  location: "",
  social: "",
  primaryCta: "",
  desiredActions: "",
  personality: "",
  colorsAvoid: "",
  fonts: "",
  dislikes: "",
  designNotes: "",
  features: [],
  featuresOther: "",
  toolLinks: "",
  aboutText: "",
  servicesText: "",
  productsText: "",
  pricingText: "",
  testimonialsText: "",
  faqText: "",
  contactInfo: "",
  languages: ["en"],
  files: [],
  assetNotes: "",
  acceptTerms: false,
  acceptPaymentAgreement: false,
  website2: "",
};

/** Fields that must never be restored from storage. */
export const NON_PERSISTED: (keyof Draft)[] = ["acceptTerms", "acceptPaymentAgreement", "website2"];

export const STEP_IDS = ["package", "configure", "addons", "details", "brief", "assets", "review"] as const;
export type StepId = (typeof STEP_IDS)[number];

export type PageKey =
  | "home" | "about" | "services" | "contact" | "gallery" | "journal" | "menu" | "shop"
  | "booking" | "team" | "pricing" | "faq" | "testimonials" | "careers" | "locations" | "events";

export const DEFAULT_PAGES: Record<PackageId, PageKey[]> = {
  starter: ["home", "about", "contact"],
  business: ["home", "about", "services", "gallery", "contact"],
  premium: ["home", "about", "services", "gallery", "journal", "contact"],
};

export const PAGE_SUGGESTIONS: PageKey[] = [
  "home", "about", "services", "contact", "gallery", "menu", "shop", "booking",
  "team", "pricing", "faq", "journal", "testimonials", "careers", "locations", "events",
];

/** Extra pages beyond the package allowance are billed automatically. */
export function withDerivedAddOns(draft: Draft): Draft {
  const pkg = getPackage(draft.packageId);
  if (!pkg) return draft;
  const extra = Math.max(0, draft.pages.length - pkg.pageLimit);
  const addOns = { ...draft.addOns };
  if (extra > 0) addOns["extra-pages"] = extra;
  else delete addOns["extra-pages"];
  for (const id of Object.keys(addOns) as (keyof SelectedAddOns)[]) {
    if (!addOns[id]) delete addOns[id];
  }
  return { ...draft, addOns };
}

const STEP_SCHEMAS: Record<StepId, z.ZodType> = {
  package: packageStepSchema,
  configure: configureStepSchema,
  addons: addOnsStepSchema,
  details: projectStepSchema,
  brief: briefStepSchema,
  assets: assetsStepSchema,
  review: reviewStepSchema,
};

export function validateStep(step: StepId, draft: Draft): Record<string, ErrorCode> {
  const result = STEP_SCHEMAS[step].safeParse(draft);
  return result.success ? {} : fieldErrors(result.error);
}
