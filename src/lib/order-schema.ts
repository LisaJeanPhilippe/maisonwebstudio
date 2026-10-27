import { z } from "zod";
import { ADD_ON_IDS, INDUSTRY_IDS, STYLE_IDS } from "./catalog";

/**
 * Validation is shared by the browser (for fast feedback) and the server
 * (which is authoritative). Messages are error codes; the UI translates them
 * via the `validation` dictionary.
 */
export const ERROR_CODES = [
  "packageRequired",
  "styleRequired",
  "pagesRequired",
  "pageName",
  "nameRequired",
  "emailInvalid",
  "phoneInvalid",
  "businessRequired",
  "industryRequired",
  "urlInvalid",
  "goalsTooShort",
  "tooLong",
  "filesRequired",
  "agreementRequired",
  "termsRequired",
  "invalid",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

const text = (max: number) => z.string({ message: "invalid" }).trim().max(max, { message: "tooLong" });
const optionalText = (max: number) => text(max).optional().default("");

export const packageStepSchema = z.object({
  packageId: z.enum(["starter", "business", "premium"], { message: "packageRequired" }),
});

export const configureStepSchema = z.object({
  style: z.enum(STYLE_IDS, { message: "styleRequired" }),
  pages: z
    .array(text(60).min(1, { message: "pageName" }), { message: "pagesRequired" })
    .min(1, { message: "pagesRequired" })
    .max(32, { message: "tooLong" }),
  colorNotes: optionalText(300),
});

export const addOnsStepSchema = z.object({
  addOns: z.partialRecord(z.enum(ADD_ON_IDS), z.number().int().min(0).max(20), { message: "invalid" }),
});

const optionalUrl = text(300).refine(
  (v) => v === "" || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i.test(v),
  { message: "urlInvalid" },
);

export const projectStepSchema = z.object({
  fullName: text(120).min(2, { message: "nameRequired" }),
  email: text(200).pipe(z.email({ message: "emailInvalid" })),
  phone: text(40).refine((v) => v === "" || /^[+()\d\s.-]{7,}$/.test(v), { message: "phoneInvalid" }),
  businessName: text(160).min(2, { message: "businessRequired" }),
  industry: z.enum(INDUSTRY_IDS as [string, ...string[]], { message: "industryRequired" }),
  currentWebsite: optionalUrl,
  goals: text(2000).min(20, { message: "goalsTooShort" }),
  audience: optionalText(1000),
  inspiration: optionalText(1000),
  hasDomain: z.enum(["yes", "no", "unsure"], { message: "invalid" }),
  launchDate: optionalText(40),
});

export const uploadedFileSchema = z.object({
  id: z.string().regex(/^[a-f0-9-]{36}$/i, { message: "invalid" }),
  name: text(200),
  size: z.number().int().nonnegative(),
  type: text(120),
});

export const assetsStepSchema = z.object({
  files: z.array(uploadedFileSchema).min(1, { message: "filesRequired" }).max(15, { message: "tooLong" }),
  assetNotes: optionalText(1000),
});

export const reviewStepSchema = z.object({
  acceptPaymentAgreement: z.literal(true, { message: "agreementRequired" }),
  acceptTerms: z.literal(true, { message: "termsRequired" }),
});

export const orderSchema = z.object({
  ...packageStepSchema.shape,
  ...configureStepSchema.shape,
  ...addOnsStepSchema.shape,
  ...projectStepSchema.shape,
  ...assetsStepSchema.shape,
  ...reviewStepSchema.shape,
  /** UI language the order was placed in (informational only). */
  locale: text(10).optional().default("en"),
  /** Honeypot: hidden from people, often filled by bots. Must be empty. */
  website2: z.string().max(0, { message: "invalid" }).optional().default(""),
});

export type OrderInput = z.input<typeof orderSchema>;
export type Order = z.output<typeof orderSchema>;
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

/** Flattens zod issues into a { field: errorCode } map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, ErrorCode> {
  const out: Record<string, ErrorCode> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_form");
    const code = (ERROR_CODES as readonly string[]).includes(issue.message) ? (issue.message as ErrorCode) : "invalid";
    if (!out[key]) out[key] = code;
  }
  return out;
}
