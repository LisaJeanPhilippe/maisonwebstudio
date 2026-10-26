import { z } from "zod";
import { ADD_ONS, INDUSTRIES, STYLE_DIRECTIONS } from "./catalog";

const addOnIds = ADD_ONS.map((a) => a.id) as [string, ...string[]];

export const packageStepSchema = z.object({
  packageId: z.enum(["starter", "business", "premium"], { message: "Choose a package to continue." }),
});

export const configureStepSchema = z.object({
  style: z.enum(STYLE_DIRECTIONS.map((s) => s.id) as [string, ...string[]], {
    message: "Pick a style direction.",
  }),
  pages: z.array(z.string().trim().min(1).max(60)).min(1, "Add at least one page.").max(32),
  colorNotes: z.string().trim().max(300).optional().default(""),
});

export const addOnsStepSchema = z.object({
  addOns: z.partialRecord(z.enum(addOnIds), z.number().int().min(0).max(20)),
});

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(v), {
    message: "Enter a valid web address (e.g. yourbusiness.com).",
  });

export const projectStepSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || /^[+()\d\s.-]{7,}$/.test(v), { message: "Enter a valid phone number." }),
  businessName: z.string().trim().min(2, "Tell us your business name.").max(160),
  industry: z.enum(INDUSTRIES, { message: "Select your industry." }),
  currentWebsite: optionalUrl,
  goals: z.string().trim().min(20, "A sentence or two helps us plan — at least 20 characters.").max(2000),
  audience: z.string().trim().max(1000).optional().default(""),
  inspiration: z.string().trim().max(1000).optional().default(""),
  hasDomain: z.enum(["yes", "no", "unsure"]),
  launchDate: z.string().trim().max(40).optional().default(""),
});

export const uploadedFileSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  name: z.string().max(200),
  size: z.number().int().nonnegative(),
  type: z.string().max(120),
});

export const assetsStepSchema = z.object({
  files: z
    .array(uploadedFileSchema)
    .min(1, "Upload your content to continue, such as your logo, photos or text.")
    .max(15),
  assetNotes: z.string().trim().max(1000).optional().default(""),
});

export const reviewStepSchema = z.object({
  acceptPaymentAgreement: z.literal(true, {
    message: "Please confirm you understand that all payments are final.",
  }),
  acceptTerms: z.literal(true, { message: "Please accept the terms to continue." }),
});

export const orderSchema = packageStepSchema
  .merge(configureStepSchema)
  .merge(addOnsStepSchema)
  .merge(projectStepSchema)
  .merge(assetsStepSchema)
  .merge(reviewStepSchema);

export type OrderInput = z.input<typeof orderSchema>;
export type Order = z.output<typeof orderSchema>;
export type UploadedFile = z.infer<typeof uploadedFileSchema>;

/** Flattens zod issues into a { field: message } map for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
