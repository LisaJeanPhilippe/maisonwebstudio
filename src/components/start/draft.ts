import type { z } from "zod";
import { getPackage, type PackageId, type SelectedAddOns } from "@/lib/catalog";
import {
  addOnsStepSchema,
  assetsStepSchema,
  configureStepSchema,
  fieldErrors,
  packageStepSchema,
  projectStepSchema,
  reviewStepSchema,
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
  files: UploadedFile[];
  assetNotes: string;
  paymentPlan: "full" | "deposit";
  acceptTerms: boolean;
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
  files: [],
  assetNotes: "",
  paymentPlan: "full",
  acceptTerms: false,
};

export const STEPS = [
  { id: "package", label: "Package" },
  { id: "configure", label: "Configure" },
  { id: "addons", label: "Add-ons" },
  { id: "details", label: "Your project" },
  { id: "assets", label: "Assets" },
  { id: "review", label: "Review & pay" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

export const DEFAULT_PAGES: Record<PackageId, string[]> = {
  starter: ["Home", "About", "Contact"],
  business: ["Home", "About", "Services", "Gallery", "Contact"],
  premium: ["Home", "About", "Services", "Gallery", "Journal", "Contact"],
};

export const PAGE_SUGGESTIONS = [
  "Home", "About", "Services", "Contact", "Gallery", "Menu", "Shop", "Booking",
  "Team", "Pricing", "FAQ", "Journal", "Testimonials", "Careers", "Locations", "Events",
];

/** Extra pages beyond the package allowance are billed automatically. */
export function withDerivedAddOns(draft: Draft): Draft {
  const pkg = getPackage(draft.packageId);
  if (!pkg) return draft;
  const extra = Math.max(0, draft.pages.length - pkg.pageLimit);
  const addOns = { ...draft.addOns };
  if (extra > 0) addOns["extra-pages"] = extra;
  else delete addOns["extra-pages"];
  // Drop add-ons that the chosen package already includes.
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
  assets: assetsStepSchema,
  review: reviewStepSchema,
};

export function validateStep(step: StepId, draft: Draft): Record<string, string> {
  const result = STEP_SCHEMAS[step].safeParse(draft);
  return result.success ? {} : fieldErrors(result.error);
}
