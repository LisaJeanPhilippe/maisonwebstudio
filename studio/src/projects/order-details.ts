import { ADD_ONS, getPackage, INDUSTRIES } from "../../../src/lib/catalog";

/**
 * Turns a website order (the customer's answers) into labelled, grouped rows for the dashboard
 * and a plain-text summary the studio can copy into an email or save.
 */

export const CTA_LABEL: Record<string, string> = {
  book: "Book an appointment",
  quote: "Request a quote",
  order: "Order online",
  shop: "Shop products",
  consult: "Schedule a consultation",
  contact: "Contact us",
  call: "Call us",
  visit: "Visit in person",
};

const CONTACT_METHOD: Record<string, string> = { email: "Email", phone: "Phone call", text: "Text message" };
const DOMAIN: Record<string, string> = { yes: "Yes", no: "No", unsure: "Not sure" };
const FEATURE: Record<string, string> = {
  contactForm: "Contact form",
  booking: "Online booking",
  payments: "Online payments",
  deposits: "Deposits",
  ecommerce: "Online store",
  catalog: "Product catalog",
  menu: "Menu",
  ordering: "Online ordering",
  newsletter: "Newsletter signup",
  maps: "Map / directions",
  social: "Social media links",
  accounts: "Customer accounts",
};
const LANG: Record<string, string> = { en: "English", es: "Spanish", fr: "French", pt: "Portuguese", ru: "Russian", zh: "Chinese", hi: "Hindi", ar: "Arabic", bn: "Bengali", id: "Indonesian" };

type Field = [key: string, label: string, format?: (v: unknown, o: Record<string, unknown>) => string];

const list = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);
const mapList = (m: Record<string, string>) => (v: unknown) => list(v).map((x) => m[x] ?? x).join(", ");

export const ORDER_GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Contact",
    fields: [
      ["fullName", "Name"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["contactMethod", "Preferred contact method", (v) => CONTACT_METHOD[String(v)] ?? String(v)],
      ["contactTime", "Best time to reach them"],
    ],
  },
  {
    title: "Order",
    fields: [
      ["packageId", "Package", (v) => getPackage(String(v))?.name ?? String(v)],
      [
        "addOns",
        "Add-ons",
        (v) =>
          Object.entries((v ?? {}) as Record<string, number>)
            .filter(([, n]) => Number(n) > 0)
            .map(([id, n]) => `${ADD_ONS.find((a) => a.id === id)?.name ?? id}${Number(n) > 1 ? ` × ${n}` : ""}`)
            .join(", "),
      ],
      ["style", "Design direction"],
      ["pages", "Pages", (v) => list(v).join(", ")],
      ["languages", "Website languages", mapList(LANG)],
      ["hasDomain", "Owns a domain", (v) => DOMAIN[String(v)] ?? String(v)],
      ["launchDate", "Ideal launch date"],
    ],
  },
  {
    title: "Business",
    fields: [
      ["businessName", "Business name"],
      ["industry", "Industry", (v) => INDUSTRIES[String(v) as keyof typeof INDUSTRIES] ?? String(v)],
      ["location", "Location"],
      ["businessDescription", "Description"],
      ["currentWebsite", "Current website"],
      ["social", "Social media"],
      ["contactInfo", "Contact details to show on the website"],
    ],
  },
  {
    title: "Goals",
    fields: [
      ["goals", "What the website should achieve"],
      ["primaryCta", "Main thing visitors should do", (v) => CTA_LABEL[String(v)] ?? String(v)],
      ["desiredActions", "Other actions"],
      ["audience", "Ideal customers"],
    ],
  },
  {
    title: "Design",
    fields: [
      ["personality", "Brand personality"],
      ["colorNotes", "Brand colors / notes"],
      ["colorsAvoid", "Colors to avoid"],
      ["fonts", "Fonts"],
      ["inspiration", "Websites they admire"],
      ["dislikes", "Dislikes"],
      ["designNotes", "Other design notes"],
    ],
  },
  {
    title: "Features",
    fields: [
      ["features", "Features", mapList(FEATURE)],
      ["featuresOther", "Other features"],
      ["toolLinks", "Existing tools / links"],
    ],
  },
  {
    title: "Content",
    fields: [
      ["aboutText", "About"],
      ["servicesText", "Services"],
      ["productsText", "Products"],
      ["pricingText", "Pricing"],
      ["testimonialsText", "Testimonials"],
      ["faqText", "FAQ"],
      ["assetNotes", "Notes about the files"],
    ],
  },
];

const HIDDEN = new Set(["files", "acceptTerms", "acceptPaymentAgreement", "website2", "ref", "locale"]);

const show = (v: unknown) => !(v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length));

/** Grouped [label, value] rows. Answers not in the known list appear under "Other" so nothing is lost. */
export function orderSections(order: Record<string, unknown>) {
  const known = new Set(ORDER_GROUPS.flatMap((g) => g.fields.map((f) => f[0])));
  const sections = ORDER_GROUPS.map((g) => ({
    title: g.title,
    rows: g.fields.filter(([k]) => show(order[k])).map(([k, label, fmt]) => [label, fmt ? fmt(order[k], order) : String(order[k])] as [string, string]).filter(([, v]) => v !== ""),
  }));
  const other = Object.entries(order)
    .filter(([k, v]) => !known.has(k) && !HIDDEN.has(k) && show(v))
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v)] as [string, string]);
  if (other.length) sections.push({ title: "Other", rows: other });
  return sections.filter((s) => s.rows.length);
}

export function orderSummaryText(p: { business_name: string; order_id: string; submitted_at: string | null; amount_cents: number; payment_status: string }, order: Record<string, unknown>, files: { name: string; kind: string }[]) {
  const lines = [`Maison Web Studio — website order`, `Order ${p.order_id}${p.submitted_at ? ` · submitted ${p.submitted_at.slice(0, 10)}` : ""}`, `Total $${Math.round(p.amount_cents / 100)} · payment ${p.payment_status.replace(/_/g, " ")}`, ""];
  for (const s of orderSections(order)) {
    lines.push(s.title.toUpperCase());
    for (const [label, value] of s.rows) lines.push(value.includes("\n") ? `${label}:\n${value.replace(/^/gm, "  ")}` : `${label}: ${value}`);
    lines.push("");
  }
  if (files.length) {
    lines.push("FILES");
    for (const f of files) lines.push(`- ${f.name}${f.kind === "inspiration" ? " (inspiration)" : ""}`);
  }
  return lines.join("\n").trim() + "\n";
}
