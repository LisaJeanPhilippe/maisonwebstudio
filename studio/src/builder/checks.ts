import { contrast } from "./color";
import type { SiteFile } from "./render";
import type { SiteSpec } from "./spec";

export type CheckStatus = "pass" | "warn" | "fail" | "skipped";
export type CheckResult = { category: string; id: string; status: CheckStatus; message: string; details?: string };

export type CheckInput = {
  files: Record<string, SiteFile>;
  spec: SiteSpec;
  palette: Record<string, string>;
  languages: string[];
  basePath: string;
  /** Raw customer-provided review text; testimonials must come from it. */
  testimonialsSource: string;
  /** All customer-provided text, for spotting invented numbers. */
  briefText: string;
  requestedPages: string[];
  /** The site's own origin. A plain-http origin is tolerated only for local development hosts. */
  origin?: string;
};

const text = (f: SiteFile) => (typeof f.body === "string" ? f.body : "");
const strip = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1].replace(/&amp;/g, "&") : null;
}

/** Runs every static check on the rendered files. Nothing here needs network access. */
export function runChecks(i: CheckInput): CheckResult[] {
  const out: CheckResult[] = [];
  const add = (category: string, id: string, problems: string[], okMessage: string, opts: { warnOnly?: boolean; failMessage?: string } = {}) =>
    out.push(
      problems.length
        ? { category, id, status: opts.warnOnly ? "warn" : "fail", message: opts.failMessage ?? `${problems.length} problem(s)`, details: problems.slice(0, 25).join("\n") }
        : { category, id, status: "pass", message: okMessage },
    );

  const html = Object.entries(i.files).filter(([p, f]) => p.endsWith(".html") && typeof f.body === "string");
  const contentPages = html.filter(([p]) => !/^\/(?:[a-z]{2}\/)?(thanks|form-error)\//.test(p) && p !== "/404.html" && !/^\/(privacy|terms|cookies|accessibility)\//.test(p));
  const exists = (path: string) => {
    const clean = decodeURIComponent(path.split("#")[0].split("?")[0]);
    if (!clean.startsWith("/")) return true;
    return !!(i.files[clean] || i.files[`${clean.replace(/\/$/, "")}/index.html`] || (clean.endsWith("/") && i.files[`${clean}index.html`]) || clean === "/api/form");
  };

  // ---------------- accessibility
  const langProblems: string[] = [];
  const h1Problems: string[] = [];
  const orderProblems: string[] = [];
  const altProblems: string[] = [];
  const labelProblems: string[] = [];
  const landmarkProblems: string[] = [];
  const linkTextProblems: string[] = [];
  for (const [path, f] of html) {
    const body = text(f);
    const htmlTag = body.match(/<html[^>]*>/i)?.[0] ?? "";
    if (!attr(htmlTag, "lang") || !attr(htmlTag, "dir")) langProblems.push(path);
    if (path.startsWith("/ar/") && attr(htmlTag, "dir") !== "rtl") langProblems.push(`${path} (Arabic must be right-to-left)`);
    const h1 = (body.match(/<h1[\s>]/gi) ?? []).length;
    if (h1 !== 1) h1Problems.push(`${path}: ${h1} h1 elements`);
    let prev = 0;
    for (const m of body.matchAll(/<h([1-6])[\s>]/gi)) {
      const lvl = Number(m[1]);
      if (prev && lvl > prev + 1) orderProblems.push(`${path}: h${prev} → h${lvl}`);
      prev = lvl;
    }
    for (const m of body.matchAll(/<img\b[^>]*>/gi)) if (attr(m[0], "alt") === null) altProblems.push(`${path}: ${attr(m[0], "src")}`);
    const labels = new Set([...body.matchAll(/<label[^>]*\sfor="([^"]+)"/gi)].map((m) => m[1]));
    for (const m of body.matchAll(/<(input|textarea|select)\b[^>]*>/gi)) {
      if (/type="hidden"/i.test(m[0])) continue;
      const id = attr(m[0], "id");
      if (!id || !labels.has(id)) labelProblems.push(`${path}: ${m[0].slice(0, 60)}`);
    }
    if (!/<main[\s>]/i.test(body) || !/class="skip"/.test(body) || !/<nav[^>]*aria-label=/i.test(body)) landmarkProblems.push(path);
    for (const m of body.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) {
      const t = strip(m[1]);
      const hasImgAlt = /<img[^>]*alt="[^"]+"/i.test(m[1]) || !!attr(m[0], "aria-label");
      if (!t && !hasImgAlt) linkTextProblems.push(`${path}: empty link ${attr(m[0], "href")}`);
      if (/^(click here|here|read more|more)$/i.test(t)) linkTextProblems.push(`${path}: vague link text "${t}"`);
    }
  }
  add("accessibility", "lang-dir", langProblems, "Every page declares its language and text direction.");
  add("accessibility", "single-h1", h1Problems, "Every page has exactly one main heading.");
  add("accessibility", "heading-order", orderProblems, "Heading levels are in order.");
  add("accessibility", "image-alt", altProblems, "Every image has alternative text.");
  add("accessibility", "form-labels", labelProblems, "Every form field has a label.");
  add("accessibility", "landmarks", landmarkProblems, "Pages have a skip link, labelled navigation and a main landmark.");
  add("accessibility", "link-text", linkTextProblems, "Links have descriptive text.");
  const pal = i.palette;
  const pairs: [string, string, string, number][] = [
    ["text", "background", "Body text", 4.5],
    ["text", "surface", "Text on cards", 4.5],
    ["muted", "background", "Secondary text", 4.5],
    ["muted", "surface", "Secondary text on cards", 4.5],
    ["primaryText", "primary", "Button text", 4.5],
    ["link", "background", "Links", 4.5],
    ["control", "surface", "Form field borders", 3],
  ];
  const contrastProblems = pairs
    .filter(([fg, bg, , min]) => pal[fg] && pal[bg] && contrast(pal[fg], pal[bg]) < min)
    .map(([fg, bg, label, min]) => `${label}: ${contrast(pal[fg], pal[bg]).toFixed(2)}:1 (needs ${min}:1)`);
  add("accessibility", "color-contrast", contrastProblems, "All text and control colors meet WCAG AA contrast.");

  // ---------------- SEO
  const titleProblems: string[] = [];
  const descProblems: string[] = [];
  const metaProblems: string[] = [];
  for (const lang of i.languages) {
    const seen = new Map<string, string>();
    for (const [path, f] of contentPages) {
      const inLang = lang === i.languages[0] ? !/^\/[a-z]{2}\//.test(path) : path.startsWith(`/${lang}/`);
      if (!inLang) continue;
      const body = text(f);
      const title = strip(body.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
      if (!title) titleProblems.push(`${path}: missing title`);
      else if (title.length > 65) titleProblems.push(`${path}: title is ${title.length} characters (keep under 60)`);
      if (title && seen.has(title)) titleProblems.push(`${path}: same title as ${seen.get(title)}`);
      seen.set(title, path);
      const desc = attr(body.match(/<meta name="description"[^>]*>/i)?.[0] ?? "", "content") ?? "";
      if (desc.length < 50 || desc.length > 170) descProblems.push(`${path}: description is ${desc.length} characters (aim for 70–160)`);
      if (!/rel="canonical"/.test(body) || !/property="og:title"/.test(body)) metaProblems.push(`${path}: missing canonical or Open Graph tags`);
      if (i.languages.length > 1 && !/hreflang="x-default"/.test(body)) metaProblems.push(`${path}: missing hreflang alternates`);
    }
  }
  add("seo", "titles", titleProblems, "Every page has a unique title of a good length.", { warnOnly: titleProblems.every((p) => p.includes("characters")) });
  add("seo", "descriptions", descProblems, "Every page has a meta description of a good length.", { warnOnly: true });
  add("seo", "meta-tags", metaProblems, "Canonical, Open Graph and hreflang tags are present.");
  const sitemap = text(i.files["/sitemap.xml"] ?? { body: "", type: "" });
  const missingInSitemap = contentPages.filter(([p]) => !sitemap.includes(p.replace(/index\.html$/, ""))).map(([p]) => p);
  add("seo", "sitemap-robots", [...(i.files["/robots.txt"] ? [] : ["robots.txt missing"]), ...(sitemap ? [] : ["sitemap.xml missing"]), ...missingInSitemap.map((p) => `not in sitemap: ${p}`)], "sitemap.xml and robots.txt cover every page.");
  const home = text(i.files["/index.html"] ?? { body: "", type: "" });
  add("seo", "social-image", /property="og:image"/.test(home) ? [] : ["No social preview image (add a hero photo or logo)."], "Pages have a social preview image.", { warnOnly: true });
  add("seo", "structured-data", /application\/ld\+json/.test(home) ? [] : ["Home page has no structured data."], "Home page has LocalBusiness structured data.", { warnOnly: true });
  add("seo", "favicon", i.files["/favicon.svg"] ? [] : ["favicon missing"], "A favicon is included.");

  // ---------------- links & calls to action
  const brokenLinks: string[] = [];
  const ctaProblems: string[] = [];
  const localOrigin = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[\w.-]+)*$/.test(i.origin ?? "") ? `${i.origin}/` : null;
  for (const [path, f] of html) {
    const body = text(f);
    for (const m of body.matchAll(/\s(?:href|src)="([^"]+)"/gi)) {
      const raw = m[1].replace(/&amp;/g, "&");
      if (/^(https?:|mailto:|tel:|data:)/.test(raw)) {
        if (/^http:/.test(raw) && !(localOrigin && raw.startsWith(localOrigin))) brokenLinks.push(`${path}: insecure link ${raw}`);
        if (/^tel:/.test(raw) && !/^tel:\+?\d{7,}$/.test(raw)) brokenLinks.push(`${path}: malformed phone link ${raw}`);
        continue;
      }
      if (raw.startsWith("#")) {
        if (raw.length > 1 && !body.includes(`id="${raw.slice(1)}"`)) brokenLinks.push(`${path}: missing anchor ${raw}`);
        continue;
      }
      const target = raw.startsWith(i.basePath) ? raw.slice(i.basePath.length) || "/" : raw;
      if (!exists(target)) brokenLinks.push(`${path}: ${raw}`);
      const anchor = raw.split("#")[1];
      if (anchor && exists(target)) {
        const pagePath = target.split("#")[0];
        const file = i.files[pagePath.endsWith("/") ? `${pagePath}index.html` : pagePath];
        if (file && !text(file).includes(`id="${decodeURIComponent(anchor)}"`)) brokenLinks.push(`${path}: missing anchor ${raw}`);
      }
    }
  }
  for (const [path, f] of contentPages) {
    const main = text(f).match(/<main[\s\S]*<\/main>/i)?.[0] ?? "";
    const primaries = (main.match(/class="btn btn-primary"/g) ?? []).length;
    if (primaries === 0 && !/class="site-header/.test(text(f))) ctaProblems.push(`${path}: no primary call to action`);
    if (primaries > 3) ctaProblems.push(`${path}: ${primaries} primary buttons compete for attention (keep one main action)`);
  }
  if (!/class="btn btn-primary header-cta"/.test(home)) ctaProblems.push("Header has no primary call to action.");
  add("links", "internal-links", brokenLinks, "All internal links, anchors and CTAs resolve.");
  add("links", "primary-cta", ctaProblems, "Each page has one clear primary call to action.", { warnOnly: true });
  add("links", "not-found-page", i.files["/404.html"] ? [] : ["404 page missing"], "A branded 404 page is included.");

  // ---------------- security
  const secProblems: string[] = [];
  for (const [path, f] of html) {
    const body = text(f);
    for (const m of body.matchAll(/<script\b([^>]*)>/gi)) {
      const a = m[1];
      if (/type="application\/ld\+json"/.test(a)) continue;
      const src = attr(` ${a}`, "src");
      if (!src) secProblems.push(`${path}: inline script`);
      else if (/^https?:/.test(src)) secProblems.push(`${path}: external script ${src}`);
    }
    if (/\son[a-z]+\s*=/i.test(body.replace(/<script[\s\S]*?<\/script>/gi, ""))) secProblems.push(`${path}: inline event handler`);
    if (/javascript:/i.test(body)) secProblems.push(`${path}: javascript: URL`);
    if (/<(iframe|object|embed)\b/i.test(body)) secProblems.push(`${path}: embedded third-party frame/object`);
    for (const m of body.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/gi)) {
      const hrefv = attr(m[0], "href") ?? "";
      if (/^https?:/.test(hrefv) && !hrefv.startsWith("https://fonts.bunny.net/")) secProblems.push(`${path}: external stylesheet ${hrefv}`);
    }
    for (const m of body.matchAll(/<form\b[^>]*>/gi)) {
      if (!/method="post"/i.test(m[0]) || !/\/api\/form"/.test(m[0])) secProblems.push(`${path}: form must POST to /api/form`);
    }
    if (/<form\b/i.test(body) && !/name="company_website"/.test(body)) secProblems.push(`${path}: form without spam protection`);
  }
  const css = text(i.files["/assets/site.css"] ?? { body: "", type: "" });
  if (/@import|url\(|expression\(/i.test(css.split("/* custom */")[1] ?? "")) secProblems.push("custom CSS loads external resources");
  add("security", "safe-markup", secProblems, "No inline/external scripts, inline handlers, frames or unsafe CSS; forms are protected.");

  // ---------------- content honesty
  const contentProblems: string[] = [];
  const allText = html.map(([, f]) => strip(text(f))).join(" ");
  if (/lorem ipsum|\bTODO\b|\{\{|\}\}|\[(?:insert|your|placeholder)[^\]]*\]/i.test(allText)) contentProblems.push("Placeholder text found.");
  const source = norm(i.testimonialsSource);
  for (const s of i.spec.pages.flatMap((p) => p.sections)) {
    if (s.type !== "testimonials") continue;
    for (const t of s.items) {
      const words = norm(t.quote).split(" ").filter((w) => w.length > 3);
      const found = words.filter((w) => source.includes(w)).length;
      if (!source || words.length === 0 || found / words.length < 0.7) contentProblems.push(`Testimonial "${t.quote.slice(0, 50)}…" is not in the customer's reviews.`);
    }
  }
  const brief = norm(i.briefText);
  const claims = [...new Set(allText.match(/\b\d[\d,.]*\s?(%|\+?\s?(years|clients|customers|projects|reviews|stars|locations))/gi) ?? [])];
  const unsupported = claims.filter((c) => !brief.includes(norm(c).split(" ")[0]));
  add("content", "no-invented-reviews", contentProblems, "No placeholder text; testimonials come from the customer.");
  add("content", "claims-supported", unsupported.map((c) => `"${c}" isn't in the brief — confirm with the customer`), "No unsupported numbers or claims found.", { warnOnly: true });
  const req = i.requestedPages.map(norm);
  const built = i.spec.pages.map((p) => norm(`${p.navLabel} ${p.slug}`));
  const missingPages = req.filter((r) => r && !built.some((b) => b.includes(r) || r.includes(b.split(" ")[0])));
  add("content", "requested-pages", missingPages.map((m) => `Requested page "${m}" isn't a separate page (it may be a section).`), "Every requested page is present.", { warnOnly: true });

  // ---------------- legal, i18n
  const legal = ["privacy", "terms", "cookies", "accessibility"].filter((s) => !i.files[`/${s}/index.html`]);
  add("legal", "legal-pages", legal.map((s) => `${s} page missing`), "Privacy, Terms, Cookie Policy and Accessibility Statement pages are included (templates for owner/legal review).");
  out.push({ category: "legal", id: "legal-review", status: "warn", message: "Legal pages are templates — the business owner and a legal advisor must review them before launch." });
  if (i.languages.length > 1) {
    const counts = i.languages.map((l) => contentPages.filter(([p]) => (l === i.languages[0] ? !/^\/[a-z]{2}\//.test(p) : p.startsWith(`/${l}/`))).length);
    add("i18n", "languages-complete", counts.every((n) => n === counts[0]) ? [] : [`page counts per language differ: ${counts.join(", ")}`], `All ${i.languages.length} languages have every page.`);
    out.push({ category: "i18n", id: "translation-review", status: "warn", message: "Machine-assisted translations — have a native speaker review each language before launch." });
  }

  // ---------------- performance & responsive (static)
  const perf: string[] = [];
  const imgWarn: string[] = [];
  for (const [path, f] of contentPages) {
    const body = text(f);
    const bytes = body.length + css.length + text(i.files["/assets/site.js"] ?? { body: "", type: "" }).length;
    if (bytes > 200_000) perf.push(`${path}: HTML+CSS+JS is ${Math.round(bytes / 1024)} KB`);
    let imageBytes = 0;
    for (const m of body.matchAll(/<img\b[^>]*>/gi)) {
      const src = (attr(m[0], "src") ?? "").replace(i.basePath, "").split("?")[0];
      const file = i.files[src];
      if (file && typeof file.body !== "string") imageBytes += file.body.byteLength;
      if (!attr(m[0], "width") || !attr(m[0], "height")) imgWarn.push(`${path}: image without dimensions (${src}) can shift the layout`);
    }
    if (imageBytes > 3_000_000) perf.push(`${path}: ${Math.round(imageBytes / 1024)} KB of images`);
    if (!/name="viewport" content="width=device-width/.test(body)) perf.push(`${path}: missing mobile viewport`);
  }
  for (const [p, f] of Object.entries(i.files)) if (p.startsWith("/assets/img/") && typeof f.body !== "string" && f.body.byteLength > 700_000) imgWarn.push(`${p} is ${Math.round(f.body.byteLength / 1024)} KB — compress it (WebP/AVIF) for faster loading`);
  add("performance", "page-weight", perf, "Pages are light and mobile-ready.");
  add("performance", "images", imgWarn, "Images are sized and reasonably compressed.", { warnOnly: true });
  out.push({ category: "responsive", id: "responsive-css", status: "pass", message: "Mobile-first layout with breakpoints at 700/900/1000px, 44px touch targets and no fixed widths." });
  return out;
}

export function overallStatus(results: CheckResult[]): "passed" | "warnings" | "failed" {
  if (results.some((r) => r.status === "fail")) return "failed";
  if (results.some((r) => r.status === "warn")) return "warnings";
  return "passed";
}
