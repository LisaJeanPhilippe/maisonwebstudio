import { z } from "zod";

/**
 * The AI website-building agent designs a site as a structured spec: theme, pages,
 * sections, copy and (sanitized) custom CSS. Maison's renderer turns the spec into
 * the real website (HTML, CSS, a small vetted script and a form-handling Worker),
 * so every site gets accessibility, SEO, security and i18n built in — and no
 * AI-written JavaScript ever runs.
 */

export const FONTS = {
  "system-sans": { label: "System sans", stack: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', google: null },
  "system-serif": { label: "System serif", stack: 'ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', google: null },
  inter: { label: "Inter", stack: '"Inter", system-ui, sans-serif', google: "inter:400,500,600,700" },
  "dm-sans": { label: "DM Sans", stack: '"DM Sans", system-ui, sans-serif', google: "dm-sans:400,500,700" },
  manrope: { label: "Manrope", stack: '"Manrope", system-ui, sans-serif', google: "manrope:400,500,600,700" },
  "space-grotesk": { label: "Space Grotesk", stack: '"Space Grotesk", system-ui, sans-serif', google: "space-grotesk:400,500,700" },
  "playfair-display": { label: "Playfair Display", stack: '"Playfair Display", Georgia, serif', google: "playfair-display:400,500,600,700" },
  "cormorant-garamond": { label: "Cormorant Garamond", stack: '"Cormorant Garamond", Georgia, serif', google: "cormorant-garamond:400,500,600,700" },
  fraunces: { label: "Fraunces", stack: '"Fraunces", Georgia, serif', google: "fraunces:400,500,600,700" },
  "libre-baskerville": { label: "Libre Baskerville", stack: '"Libre Baskerville", Georgia, serif', google: "libre-baskerville:400,700" },
  lora: { label: "Lora", stack: '"Lora", Georgia, serif', google: "lora:400,500,600,700" },
  "work-sans": { label: "Work Sans", stack: '"Work Sans", system-ui, sans-serif', google: "work-sans:400,500,600" },
} as const;
export type FontId = keyof typeof FONTS;
const FONT_IDS = Object.keys(FONTS) as [FontId, ...FontId[]];

const hex = z.string().describe("6-digit hex color like #1a1a1a");
/** Where a button or link goes: "page:<slug>" (home is "page:"), "section:<id>", tel:, mailto:, or an https:// URL the customer gave. */
const target = z.string().describe('"page:<slug>" (home = "page:"), "section:contact", "tel:+1…", "mailto:…", or an https:// link provided in the brief');
const cta = z.object({ label: z.string(), target });
const asset = z.string().describe("An asset id from the brief, e.g. ast_abc123");

const hero = z.object({
  type: z.literal("hero"),
  id: z.string(),
  variant: z.enum(["split", "centered", "image", "editorial"]),
  eyebrow: z.string().nullable(),
  heading: z.string(),
  subheading: z.string(),
  image: asset.nullable(),
  imageAlt: z.string().nullable(),
  primaryCta: cta,
  secondaryCta: cta.nullable(),
});
const text = z.object({ type: z.literal("text"), id: z.string(), eyebrow: z.string().nullable(), heading: z.string(), paragraphs: z.array(z.string()) });
const features = z.object({
  type: z.literal("features"),
  id: z.string(),
  heading: z.string(),
  intro: z.string().nullable(),
  columns: z.enum(["2", "3", "4"]),
  items: z.array(z.object({ title: z.string(), body: z.string(), price: z.string().nullable() })),
});
const imageText = z.object({
  type: z.literal("imageText"),
  id: z.string(),
  heading: z.string(),
  paragraphs: z.array(z.string()),
  image: asset,
  imageAlt: z.string(),
  imageSide: z.enum(["start", "end"]),
  cta: cta.nullable(),
});
const gallery = z.object({ type: z.literal("gallery"), id: z.string(), heading: z.string(), images: z.array(z.object({ asset, alt: z.string() })) });
const menu = z.object({
  type: z.literal("menu"),
  id: z.string(),
  heading: z.string(),
  note: z.string().nullable(),
  categories: z.array(z.object({ name: z.string(), items: z.array(z.object({ name: z.string(), description: z.string().nullable(), price: z.string().nullable() })) })),
});
const pricing = z.object({
  type: z.literal("pricing"),
  id: z.string(),
  heading: z.string(),
  plans: z.array(z.object({ name: z.string(), price: z.string(), description: z.string().nullable(), features: z.array(z.string()), cta: cta.nullable() })),
});
const testimonials = z.object({
  type: z.literal("testimonials"),
  id: z.string(),
  heading: z.string(),
  items: z.array(z.object({ quote: z.string().describe("Copied from the customer's real reviews in the brief"), author: z.string() })),
});
const faq = z.object({ type: z.literal("faq"), id: z.string(), heading: z.string(), items: z.array(z.object({ question: z.string(), answer: z.string() })) });
const steps = z.object({ type: z.literal("steps"), id: z.string(), heading: z.string(), items: z.array(z.object({ title: z.string(), body: z.string() })) });
const products = z.object({
  type: z.literal("products"),
  id: z.string(),
  heading: z.string(),
  items: z.array(z.object({ name: z.string(), description: z.string(), price: z.string().nullable(), image: asset.nullable(), imageAlt: z.string().nullable(), link: z.string().nullable() })),
});
const ctaBand = z.object({ type: z.literal("cta"), id: z.string(), heading: z.string(), body: z.string().nullable(), cta });
const contact = z.object({
  type: z.literal("contact"),
  id: z.string(),
  heading: z.string(),
  intro: z.string().nullable(),
  form: z.enum(["none", "contact", "booking", "quote", "order"]),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  hours: z.array(z.string()),
  mapQuery: z.string().nullable().describe("Address for a 'Get directions' link (no embedded map)"),
});

export const sectionSchema = z.discriminatedUnion("type", [hero, text, features, imageText, gallery, menu, pricing, testimonials, faq, steps, products, ctaBand, contact]);
export type Section = z.infer<typeof sectionSchema>;

export const pageSchema = z.object({
  slug: z.string().describe('URL slug, lowercase-with-dashes; "" for the home page'),
  navLabel: z.string(),
  title: z.string().describe("Unique SEO title, under 60 characters"),
  description: z.string().describe("Unique meta description, 70–160 characters"),
  sections: z.array(sectionSchema),
});
export type Page = z.infer<typeof pageSchema>;

export const siteSpecSchema = z.object({
  siteName: z.string(),
  tagline: z.string(),
  theme: z.object({
    style: z.enum(["minimal", "editorial", "warm", "bold", "luxury"]),
    palette: z.object({ background: hex, surface: hex, text: hex, muted: hex, primary: hex, primaryText: hex, accent: hex, border: hex }),
    headingFont: z.enum(FONT_IDS),
    bodyFont: z.enum(FONT_IDS),
    radius: z.enum(["none", "soft", "round"]),
    density: z.enum(["compact", "balanced", "airy"]),
    headingCase: z.enum(["normal", "uppercase"]),
  }),
  logo: asset.nullable(),
  primaryCta: cta.describe("The single primary call to action used in the header"),
  pages: z.array(pageSchema),
  footerBlurb: z.string(),
  customCss: z.string().describe("Optional extra CSS for polish. No @import, url(), expressions or external resources."),
  designNotes: z.string().describe("2–4 sentences for the studio: the design idea and how the inspiration was used"),
});
export type SiteSpec = z.infer<typeof siteSpecSchema>;

export const slugify = (s: string) =>
  s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Strips anything in custom CSS that could load resources, escape the stylesheet or run code. */
export function sanitizeCss(css: string): string {
  return css
    .slice(0, 8000)
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/@import[^;]*;?/gi, "")
    .replace(/url\s*\([^)]*\)/gi, "none")
    .replace(/expression\s*\(/gi, "(")
    .replace(/javascript:/gi, "")
    .replace(/behavior\s*:/gi, "x-behavior:")
    .replace(/-moz-binding/gi, "x-binding")
    .replace(/<\/|<!--|-->/g, "");
}

/**
 * Normalizes an AI spec: unique page slugs, a home page first, known asset ids only,
 * and valid link targets. Returns the problems it fixed so the studio can see them.
 */
export function normalizeSpec(spec: SiteSpec, assetIds: Set<string>, allowedLinks: string[]): { spec: SiteSpec; fixes: string[] } {
  const fixes: string[] = [];
  const seen = new Set<string>();
  const pages = spec.pages.map((p, i) => {
    let slug = i === 0 ? "" : slugify(p.slug || p.navLabel) || `page-${i}`;
    if (i === 0 && p.slug) fixes.push(`First page "${p.navLabel}" became the home page.`);
    while (seen.has(slug)) slug = `${slug}-${i}`;
    seen.add(slug);
    return { ...p, slug };
  });
  const slugs = new Set(pages.map((p) => p.slug));
  const sectionIds = new Set(pages.flatMap((p) => p.sections.map((s) => s.id)));
  const okTarget = (t: string) => {
    if (t.startsWith("page:")) return slugs.has(t.slice(5));
    if (t.startsWith("section:")) return sectionIds.has(t.slice(8));
    if (/^tel:\+?[\d\s().-]{7,}$/.test(t) || /^mailto:[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(t)) return true;
    if (/^https:\/\//.test(t)) return allowedLinks.some((l) => t.startsWith(l));
    return false;
  };
  const contactSection = pages.flatMap((p) => p.sections).find((s) => s.type === "contact");
  const fallback = contactSection ? `section:${contactSection.id}` : "page:";
  const fixCta = <T extends { label: string; target: string } | null>(c: T): T => {
    if (!c) return c;
    if (okTarget(c.target)) return c;
    fixes.push(`Link "${c.label}" pointed to "${c.target}", which doesn't exist — it now goes to ${fallback}.`);
    return { ...c, target: fallback } as T;
  };
  const fixAsset = (a: string | null) => {
    if (a && !assetIds.has(a)) {
      fixes.push(`Unknown image "${a}" was removed.`);
      return null;
    }
    return a;
  };
  const out: SiteSpec = {
    ...spec,
    logo: fixAsset(spec.logo),
    primaryCta: fixCta(spec.primaryCta),
    customCss: sanitizeCss(spec.customCss ?? ""),
    pages: pages.map((p) => ({
      ...p,
      sections: p.sections
        .map((s): Section | null => {
          switch (s.type) {
            case "hero":
              return { ...s, image: fixAsset(s.image), primaryCta: fixCta(s.primaryCta), secondaryCta: fixCta(s.secondaryCta) };
            case "imageText": {
              const image = fixAsset(s.image);
              return image ? { ...s, image, cta: fixCta(s.cta) } : { type: "text", id: s.id, eyebrow: null, heading: s.heading, paragraphs: s.paragraphs };
            }
            case "gallery": {
              const images = s.images.filter((g) => fixAsset(g.asset));
              return images.length ? { ...s, images } : null;
            }
            case "products":
              return { ...s, items: s.items.map((it) => ({ ...it, image: fixAsset(it.image), link: it.link && okTarget(it.link) ? it.link : null })) };
            case "pricing":
              return { ...s, plans: s.plans.map((pl) => ({ ...pl, cta: fixCta(pl.cta) })) };
            case "cta":
              return { ...s, cta: fixCta(s.cta) };
            default:
              return s;
          }
        })
        .filter((s): s is Section => s !== null),
    })),
  };
  if (!out.pages.length) throw new Error("The design has no pages.");
  return { spec: out, fixes };
}
