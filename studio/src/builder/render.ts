import { contrast, ensureContrast, onColor } from "./color";
import { legalPages, type LegalInput } from "./legal";
import { FONTS, type Page, type Section, type SiteSpec } from "./spec";
import { SITE_JS } from "./site-js";
import { SITE_LOCALES, UI_STRINGS, type SiteLocale } from "./ui-strings";

export type RenderAsset = { id: string; role: string; name: string; mime: string; width: number | null; height: number | null; bytes: Uint8Array | null };
export type SiteFile = { body: string | Uint8Array; type: string };

export type RenderInput = {
  /** One spec per language (the default language first in `languages`). */
  specs: Partial<Record<SiteLocale, SiteSpec>>;
  languages: SiteLocale[];
  assets: RenderAsset[];
  /** Absolute origin for canonical/Open Graph/sitemap URLs, e.g. https://example.com */
  origin: string;
  /** Path prefix for previews ("" in production). */
  basePath: string;
  /** Written into every page; deployment verification looks for it. */
  marker: string;
  legal: LegalInput;
  year: number;
};

export type RenderResult = { files: Record<string, SiteFile>; fixes: string[]; palette: Record<string, string> };

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const assetPath = (a: Pick<RenderAsset, "id" | "name">) => `/assets/img/${a.id}-${a.name}`;

/** Corrects the AI palette so every text/background pair meets WCAG 2.2 AA. */
export function resolvePalette(p: SiteSpec["theme"]["palette"]) {
  const fixes: string[] = [];
  const out = { ...p };
  const fix = (key: keyof typeof out, value: string, why: string) => {
    if (value.toLowerCase() !== String(out[key]).toLowerCase()) {
      fixes.push(`${why}: ${out[key]} → ${value}`);
      out[key] = value;
    }
  };
  fix("text", ensureContrast(ensureContrast(out.text, out.background, 4.5), out.surface, 4.5), "Body text color adjusted for contrast");
  fix("muted", ensureContrast(ensureContrast(out.muted, out.background, 4.5), out.surface, 4.5), "Secondary text color adjusted for contrast");
  if (contrast(out.primaryText, out.primary) < 4.5) fix("primaryText", onColor(out.primary), "Button text color adjusted for contrast");
  if (contrast(out.primaryText, out.primary) < 4.5) fix("primary", ensureContrast(out.primary, out.primaryText, 4.5), "Button color adjusted for contrast");
  const link = ensureContrast(out.primary, out.background, 4.5);
  const control = ensureContrast(out.border, out.surface, 3);
  return { palette: { ...out, link, control }, fixes };
}

function themeCss(spec: SiteSpec, palette: ReturnType<typeof resolvePalette>["palette"]) {
  const t = spec.theme;
  const radius = { none: "0px", soft: "10px", round: "22px" }[t.radius];
  const space = { compact: "0.8", balanced: "1", airy: "1.25" }[t.density];
  const heading = FONTS[t.headingFont]?.stack ?? FONTS["system-sans"].stack;
  const body = FONTS[t.bodyFont]?.stack ?? FONTS["system-sans"].stack;
  const styleRules: Record<string, string> = {
    minimal: "",
    editorial: "h1,h2{font-weight:400;letter-spacing:-0.02em}",
    warm: ".btn{border-radius:999px}",
    bold: "h1,h2{font-weight:800;letter-spacing:-0.035em}.sec-hero h1{font-size:clamp(2.6rem,1.6rem+5vw,5.4rem)}",
    luxury: "h1,h2{font-weight:400;letter-spacing:0.01em}.eyebrow{letter-spacing:0.22em}.btn{letter-spacing:0.08em;text-transform:uppercase;font-size:0.82rem}",
  };
  return `:root{--bg:${palette.background};--surface:${palette.surface};--text:${palette.text};--muted:${palette.muted};--primary:${palette.primary};--on-primary:${palette.primaryText};--accent:${palette.accent};--border:${palette.border};--control:${palette.control};--link:${palette.link};--radius:${radius};--s:${space};--font-heading:${heading};--font-body:${body}}
${t.headingCase === "uppercase" ? "h1,h2,h3{text-transform:uppercase}" : ""}${styleRules[t.style] ?? ""}`;
}

const BASE_CSS = `*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);font-size:1.0625rem;line-height:1.65;overflow-wrap:break-word}
img{max-width:100%;height:auto;display:block}
h1,h2,h3{font-family:var(--font-heading);line-height:1.12;margin:0 0 .5em;text-wrap:balance;overflow-wrap:anywhere}
h1{font-size:clamp(2.2rem,1.5rem+3.4vw,4.2rem)}h2{font-size:clamp(1.7rem,1.3rem+1.8vw,2.7rem)}h3{font-size:1.2rem}
p{margin:0 0 1em;max-width:68ch}
a{color:var(--link);text-underline-offset:.18em}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:3px solid var(--link);outline-offset:3px}
.skip{position:absolute;inset-inline-start:-9999px;top:8px;z-index:100;background:var(--surface);color:var(--text);padding:12px 16px;border-radius:var(--radius)}
.skip:focus{inset-inline-start:16px}
.container{width:100%;max-width:1160px;margin-inline:auto;padding-inline:clamp(16px,4vw,32px)}
.eyebrow{font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:.8em}
.muted{color:var(--muted)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:48px;padding:.75em 1.4em;border-radius:var(--radius);font-weight:600;text-decoration:none;border:2px solid transparent;font-family:inherit;font-size:1rem;cursor:pointer;line-height:1.2}
.btn-primary{background:var(--primary);color:var(--on-primary)}
.btn-primary:hover{filter:brightness(1.08)}
.btn-secondary{background:transparent;color:var(--text);border-color:var(--control)}
.btn-secondary:hover{border-color:var(--text)}
.site-header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.site-header .bar{display:flex;align-items:center;gap:16px;min-height:72px}
.brand{display:inline-flex;align-items:center;gap:10px;color:var(--text);text-decoration:none;font-family:var(--font-heading);font-size:1.25rem;font-weight:600;margin-inline-end:auto;min-height:44px}
.brand img{max-height:44px;width:auto}
.nav-desktop ul,.nav-mobile ul{list-style:none;margin:0;padding:0}
.nav-desktop{display:none}
.nav-desktop ul{display:flex;gap:4px}
.nav-desktop a,.nav-mobile a{display:inline-flex;align-items:center;min-height:44px;padding:0 12px;color:var(--text);text-decoration:none;border-radius:var(--radius)}
.nav-desktop a[aria-current=page],.nav-mobile a[aria-current=page]{text-decoration:underline;text-underline-offset:.35em;text-decoration-thickness:2px}
.header-cta{display:none}
.nav-mobile summary,.lang summary{list-style:none;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border:1px solid var(--control);border-radius:var(--radius);cursor:pointer;font-weight:500}
.nav-mobile summary::-webkit-details-marker,.lang summary::-webkit-details-marker{display:none}
.nav-mobile[open] .panel{position:absolute;inset-inline:0;top:100%;background:var(--bg);border-bottom:1px solid var(--border);padding:12px clamp(16px,4vw,32px) 20px}
.nav-mobile .panel ul{display:grid;gap:4px}.nav-mobile .panel .btn{margin-top:12px;width:100%}
.lang{position:relative}.lang ul{list-style:none;margin:0;padding:8px;position:absolute;inset-inline-end:0;top:calc(100% + 6px);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);min-width:200px;z-index:60}
.lang a{display:flex;min-height:44px;align-items:center;padding:0 12px;color:var(--text);text-decoration:none}
@media (min-width:900px){.nav-desktop{display:block}.nav-mobile{display:none}.header-cta{display:inline-flex}}
main{display:block}main:focus{outline:none}
.sec{padding-block:calc(clamp(56px,7vw,112px)*var(--s))}
.sec-alt{background:var(--surface)}
.page-head{padding-block:calc(clamp(48px,6vw,96px)*var(--s)) 0}
.sec-hero{padding-block:calc(clamp(56px,8vw,128px)*var(--s))}
.hero-grid{display:grid;gap:clamp(28px,4vw,56px);align-items:center}
@media (min-width:900px){.hero-split .hero-grid{grid-template-columns:1.05fr 1fr}}
.hero-centered{text-align:center}.hero-centered p{margin-inline:auto}.hero-centered .actions{justify-content:center}
.hero-image{position:relative;color:#fff;min-height:min(78vh,720px);display:flex;align-items:flex-end;padding-block:clamp(56px,8vw,112px)}
.hero-image .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero-image::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72),rgba(0,0,0,.25) 60%,rgba(0,0,0,.15))}
.hero-image .container{position:relative;z-index:1}.hero-image .eyebrow,.hero-image p{color:#fff}
.hero-editorial h1{font-size:clamp(2.6rem,1.4rem+5.6vw,5.8rem);max-width:16ch}
.hero-media img{border-radius:var(--radius);width:100%;aspect-ratio:4/5;object-fit:cover}
.lede{font-size:clamp(1.1rem,1rem+.4vw,1.3rem);color:var(--muted)}
.actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.grid{display:grid;gap:clamp(16px,2.4vw,28px)}
@media (min-width:700px){.cols-2,.cols-3,.cols-4{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:1000px){.cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.cols-4{grid-template-columns:repeat(4,minmax(0,1fr))}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(20px,2.4vw,32px);height:100%}
.sec-alt .card{background:var(--bg)}
.price{font-weight:600;color:var(--text)}
.split{display:grid;gap:clamp(28px,4vw,64px);align-items:center}
@media (min-width:900px){.split{grid-template-columns:1fr 1fr}.split.image-end .media{order:2}}
.split .media img{border-radius:var(--radius);width:100%;aspect-ratio:4/3;object-fit:cover}
.gallery{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media (min-width:900px){.gallery{grid-template-columns:repeat(3,minmax(0,1fr))}}
.gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:var(--radius)}
.menu-cat{margin-top:32px}.menu-item{display:flex;gap:16px;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border)}
.menu-item h4{margin:0;font-size:1.05rem}.menu-item p{margin:.2em 0 0;color:var(--muted);font-size:.95rem}
.plan ul{padding-inline-start:1.2em}.plan .amount{font-family:var(--font-heading);font-size:2rem;margin:.2em 0 .5em}
blockquote{margin:0}blockquote p{font-size:1.1rem}blockquote footer{color:var(--muted);font-size:.95rem}
details.faq{border-bottom:1px solid var(--border);padding:6px 0}
details.faq summary{cursor:pointer;min-height:48px;display:flex;align-items:center;font-weight:600;font-size:1.05rem}
.steps{counter-reset:step;list-style:none;padding:0}.steps li{counter-increment:step}
.steps li::before{content:counter(step,decimal-leading-zero);display:block;color:var(--muted);font-family:var(--font-heading);font-size:1.4rem;margin-bottom:8px}
.cta-band{background:var(--primary);color:var(--on-primary);border-radius:var(--radius);padding:clamp(32px,5vw,72px);text-align:center}
.cta-band p{margin-inline:auto;color:inherit}.cta-band .btn-primary{background:var(--on-primary);color:var(--primary)}
.contact-grid{display:grid;gap:clamp(28px,4vw,64px)}@media (min-width:900px){.contact-grid{grid-template-columns:1fr 1.2fr}}
.contact-list{list-style:none;padding:0;margin:0;display:grid;gap:14px}
form.mws-form{display:grid;gap:18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:clamp(20px,3vw,36px)}
.field label{display:block;font-weight:600;margin-bottom:6px}.field .opt{font-weight:400;color:var(--muted)}
.field input,.field textarea{width:100%;min-height:48px;padding:12px 14px;border:1px solid var(--control);border-radius:calc(var(--radius) * .6);background:var(--bg);color:var(--text);font:inherit}
.field textarea{min-height:140px;resize:vertical}
.field [aria-invalid=true]{border-color:#b3261e;border-width:2px}
.field .err{color:#b3261e;font-size:.95rem;margin:6px 0 0}
.form-status{min-height:1.5em;font-weight:500}
.hp{position:absolute;inset-inline-start:-9999px;width:1px;height:1px;overflow:hidden}
.site-footer{border-top:1px solid var(--border);padding-block:56px 32px;margin-top:0;font-size:.98rem}
.footer-grid{display:grid;gap:32px}@media (min-width:900px){.footer-grid{grid-template-columns:2fr 1fr 1fr}}
.site-footer ul{list-style:none;padding:0;margin:0;display:grid;gap:6px}
.site-footer a{color:var(--text)}
.legal-note{border:1px solid var(--border);background:var(--surface);border-radius:var(--radius);padding:14px 18px}
.legal h2{font-size:1.4rem;margin-top:1.6em}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*,*::before,*::after{animation:none!important;transition:none!important}}
@media print{.site-header,.site-footer,.skip{display:none}}`;

type Ctx = {
  lang: SiteLocale;
  spec: SiteSpec;
  input: RenderInput;
  assets: Map<string, RenderAsset>;
  ui: (typeof UI_STRINGS)[SiteLocale];
};

const defaultLang = (i: RenderInput) => i.languages[0];
const prefix = (i: RenderInput, lang: SiteLocale) => (lang === defaultLang(i) ? "" : `/${lang}`);
export const pagePath = (i: RenderInput, lang: SiteLocale, slug: string) => `${prefix(i, lang)}${slug ? `/${slug}/` : "/"}`;
const href = (i: RenderInput, path: string) => `${i.basePath}${path}`;
const abs = (i: RenderInput, path: string) => `${i.origin}${i.basePath}${path}`;

function resolveTarget(c: Ctx, target: string): { href: string; external: boolean } {
  if (target.startsWith("page:")) return { href: href(c.input, pagePath(c.input, c.lang, target.slice(5))), external: false };
  if (target.startsWith("section:")) {
    const id = target.slice(8);
    const page = c.spec.pages.find((p) => p.sections.some((s) => s.id === id));
    return { href: `${href(c.input, pagePath(c.input, c.lang, page?.slug ?? ""))}#${encodeURIComponent(id)}`, external: false };
  }
  return { href: target, external: /^https:/.test(target) };
}

function link(c: Ctx, cta: { label: string; target: string }, cls: string) {
  const t = resolveTarget(c, cta.target);
  return `<a class="${cls}" href="${esc(t.href)}"${t.external ? ' rel="noopener noreferrer"' : ""}>${esc(cta.label)}</a>`;
}

function img(c: Ctx, assetId: string | null, alt: string | null, opts: { eager?: boolean; cls?: string; sizes?: string } = {}) {
  if (!assetId) return "";
  const a = c.assets.get(assetId);
  if (!a || !a.bytes) return "";
  const dims = a.width && a.height ? ` width="${a.width}" height="${a.height}"` : "";
  const loading = opts.eager ? ' fetchpriority="high"' : ' loading="lazy"';
  return `<img${opts.cls ? ` class="${opts.cls}"` : ""} src="${esc(href(c.input, assetPath(a)))}" alt="${esc(alt ?? "")}"${dims}${loading} decoding="async">`;
}

function heading(level: number, text: string, extra = "") {
  return `<h${level}${extra}>${esc(text)}</h${level}>`;
}

function formHtml(c: Ctx, kind: string, sectionId: string) {
  const u = c.ui;
  const id = (f: string) => `${sectionId}-${f}`;
  const field = (name: string, label: string, type: string, required: boolean, auto?: string) => {
    const control =
      type === "textarea"
        ? `<textarea id="${id(name)}" name="${name}" maxlength="3000"${required ? " required" : ""} aria-describedby="${id(name)}-err"></textarea>`
        : `<input id="${id(name)}" name="${name}" type="${type}" maxlength="${type === "email" ? 200 : 120}"${auto ? ` autocomplete="${auto}"` : ""}${required ? " required" : ""} aria-describedby="${id(name)}-err">`;
    return `<div class="field"><label for="${id(name)}">${esc(label)}${required ? "" : ` <span class="opt">${esc(u.optional)}</span>`}</label>${control}<p class="err" id="${id(name)}-err" hidden></p></div>`;
  };
  const fields = [field("name", u.name, "text", true, "name"), field("email", u.email, "email", true, "email"), field("phone", u.phone, "tel", false, "tel")];
  if (kind === "booking") fields.push(field("date", u.date, "date", false), field("time", u.time, "text", false), field("service", u.service, "text", false));
  fields.push(field("message", kind === "contact" ? u.message : u.details, "textarea", true));
  return `<form class="mws-form" method="post" action="${esc(href(c.input, "/api/form"))}" data-form novalidate
 data-msg-required="${esc(u.required)}" data-msg-email="${esc(u.invalidEmail)}" data-msg-long="${esc(u.tooLong)}" data-msg-fix="${esc(u.fixErrors)}"
 data-msg-sending="${esc(u.sending)}" data-msg-sent="${esc(u.sent)}" data-msg-failed="${esc(u.failed)}" data-msg-unavailable="${esc(u.notConfigured)}" data-msg-many="${esc(u.tooMany)}">
<input type="hidden" name="form" value="${esc(kind)}"><input type="hidden" name="lang" value="${c.lang}"><input type="hidden" name="page" value="${esc(sectionId)}">
<input type="hidden" name="sid" value=""><input type="hidden" name="t" value="">
<div class="hp" aria-hidden="true"><label for="${id("company")}">Company website</label><input id="${id("company")}" name="company_website" type="text" tabindex="-1" autocomplete="off"></div>
${fields.join("\n")}
<p class="form-status" role="status" aria-live="polite"></p>
<div><button class="btn btn-primary" type="submit">${esc(u.send)}</button></div>
</form>`;
}

function section(c: Ctx, s: Section, index: number, isFirst: boolean): string {
  const h = (text: string) => heading(isFirst && s.type === "hero" ? 1 : 2, text);
  const alt = index % 2 === 1 ? " sec-alt" : "";
  const open = (cls: string) => `<section id="${esc(s.id)}" class="sec sec-${s.type}${cls}">`;
  switch (s.type) {
    case "hero": {
      const ctas = `<div class="actions">${link(c, s.primaryCta, "btn btn-primary")}${s.secondaryCta ? link(c, s.secondaryCta, "btn btn-secondary") : ""}</div>`;
      const text = `${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ""}${h(s.heading)}<p class="lede">${esc(s.subheading)}</p>${ctas}`;
      if (s.variant === "image" && s.image && c.assets.get(s.image)?.bytes)
        return `${open(" hero-image")}${img(c, s.image, s.imageAlt, { eager: isFirst, cls: "bg" })}<div class="container">${text}</div></section>`;
      if (s.variant === "split" && s.image && c.assets.get(s.image)?.bytes)
        return `${open(" hero-split")}<div class="container hero-grid"><div>${text}</div><div class="hero-media">${img(c, s.image, s.imageAlt, { eager: isFirst })}</div></div></section>`;
      return `${open(s.variant === "editorial" ? " hero-editorial" : " hero-centered")}<div class="container">${text}</div></section>`;
    }
    case "text":
      return `${open(alt)}<div class="container">${s.eyebrow ? `<p class="eyebrow">${esc(s.eyebrow)}</p>` : ""}${h(s.heading)}${s.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}</div></section>`;
    case "features":
      return `${open(alt)}<div class="container">${h(s.heading)}${s.intro ? `<p class="lede">${esc(s.intro)}</p>` : ""}<ul class="grid cols-${s.columns}" role="list" style="list-style:none;padding:0;margin-top:32px">${s.items
        .map((it) => `<li class="card"><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p>${it.price ? `<p class="price">${esc(it.price)}</p>` : ""}</li>`)
        .join("")}</ul></div></section>`;
    case "imageText":
      return `${open(alt)}<div class="container split${s.imageSide === "end" ? " image-end" : ""}"><div class="media">${img(c, s.image, s.imageAlt)}</div><div>${h(s.heading)}${s.paragraphs
        .map((p) => `<p>${esc(p)}</p>`)
        .join("")}${s.cta ? `<div class="actions">${link(c, s.cta, "btn btn-secondary")}</div>` : ""}</div></div></section>`;
    case "gallery":
      return `${open(alt)}<div class="container">${h(s.heading)}<ul class="gallery" role="list" style="list-style:none;padding:0;margin-top:28px">${s.images
        .map((g) => `<li>${img(c, g.asset, g.alt)}</li>`)
        .join("")}</ul></div></section>`;
    case "menu":
      return `${open(alt)}<div class="container">${h(s.heading)}${s.note ? `<p class="muted">${esc(s.note)}</p>` : ""}${s.categories
        .map(
          (cat) =>
            `<div class="menu-cat"><h3>${esc(cat.name)}</h3><ul role="list" style="list-style:none;padding:0;margin:0">${cat.items
              .map((it) => `<li class="menu-item"><div><h4>${esc(it.name)}</h4>${it.description ? `<p>${esc(it.description)}</p>` : ""}</div>${it.price ? `<span class="price">${esc(it.price)}</span>` : ""}</li>`)
              .join("")}</ul></div>`,
        )
        .join("")}</div></section>`;
    case "pricing":
      return `${open(alt)}<div class="container">${h(s.heading)}<ul class="grid cols-${Math.min(3, Math.max(2, s.plans.length))}" role="list" style="list-style:none;padding:0;margin-top:32px">${s.plans
        .map(
          (pl) =>
            `<li class="card plan"><h3>${esc(pl.name)}</h3><p class="amount">${esc(pl.price)}</p>${pl.description ? `<p class="muted">${esc(pl.description)}</p>` : ""}<ul>${pl.features
              .map((f) => `<li>${esc(f)}</li>`)
              .join("")}</ul>${pl.cta ? link(c, pl.cta, "btn btn-secondary") : ""}</li>`,
        )
        .join("")}</ul></div></section>`;
    case "testimonials":
      return `${open(alt)}<div class="container">${h(s.heading)}<ul class="grid cols-${Math.min(3, Math.max(2, s.items.length))}" role="list" style="list-style:none;padding:0;margin-top:32px">${s.items
        .map((t) => `<li class="card"><blockquote><p>“${esc(t.quote)}”</p><footer>— ${esc(t.author)}</footer></blockquote></li>`)
        .join("")}</ul></div></section>`;
    case "faq":
      return `${open(alt)}<div class="container" style="max-width:860px">${h(s.heading)}${s.items
        .map((q) => `<details class="faq"><summary>${esc(q.question)}</summary><p>${esc(q.answer)}</p></details>`)
        .join("")}</div></section>`;
    case "steps":
      return `${open(alt)}<div class="container">${h(s.heading)}<ol class="steps grid cols-${Math.min(4, Math.max(2, s.items.length))}" style="margin-top:32px">${s.items
        .map((it) => `<li><h3>${esc(it.title)}</h3><p>${esc(it.body)}</p></li>`)
        .join("")}</ol></div></section>`;
    case "products":
      return `${open(alt)}<div class="container">${h(s.heading)}<ul class="grid cols-3" role="list" style="list-style:none;padding:0;margin-top:32px">${s.items
        .map(
          (p) =>
            `<li class="card">${p.image ? img(c, p.image, p.imageAlt) : ""}<h3 style="margin-top:14px">${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.price ? `<p class="price">${esc(p.price)}</p>` : ""}${
              p.link ? link(c, { label: p.name, target: p.link }, "btn btn-secondary") : ""
            }</li>`,
        )
        .join("")}</ul></div></section>`;
    case "cta":
      return `<section id="${esc(s.id)}" class="sec sec-cta"><div class="container"><div class="cta-band">${h(s.heading)}${s.body ? `<p>${esc(s.body)}</p>` : ""}<div class="actions" style="justify-content:center">${link(
        c,
        s.cta,
        "btn btn-primary",
      )}</div></div></div></section>`;
    case "contact": {
      const u = c.ui;
      const items: string[] = [];
      if (s.phone) items.push(`<li><strong>${esc(u.call)}:</strong> <a href="tel:${esc(s.phone.replace(/[^\d+]/g, ""))}">${esc(s.phone)}</a></li>`);
      if (s.email) items.push(`<li><strong>${esc(u.emailUs)}:</strong> <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>`);
      if (s.address) items.push(`<li>${esc(s.address)}${s.mapQuery ? `<br><a href="https://www.google.com/maps/search/?api=1&amp;query=${encodeURIComponent(s.mapQuery)}" rel="noopener noreferrer">${esc(u.directions)}</a>` : ""}</li>`);
      if (s.hours.length) items.push(`<li><strong>${esc(u.hours)}</strong><br>${s.hours.map(esc).join("<br>")}</li>`);
      return `${open(alt)}<div class="container contact-grid"><div>${h(s.heading)}${s.intro ? `<p>${esc(s.intro)}</p>` : ""}<ul class="contact-list">${items.join("")}</ul></div>${
        s.form !== "none" ? `<div>${formHtml(c, s.form, s.id)}</div>` : ""
      }</div></section>`;
    }
  }
}

function headerHtml(c: Ctx, current: string) {
  const i = c.input;
  const nav = c.spec.pages.filter((p) => p.navLabel);
  const items = nav
    .map((p) => {
      const path = pagePath(i, c.lang, p.slug);
      return `<li><a href="${esc(href(i, path))}"${p.slug === current ? ' aria-current="page"' : ""}>${esc(p.navLabel)}</a></li>`;
    })
    .join("");
  const logo = c.spec.logo ? c.assets.get(c.spec.logo) : undefined;
  const brand = logo?.bytes
    ? `<img src="${esc(href(i, assetPath(logo)))}" alt="${esc(c.spec.siteName)}"${logo.width && logo.height ? ` width="${logo.width}" height="${logo.height}"` : ""}>`
    : `<span>${esc(c.spec.siteName)}</span>`;
  const langs =
    i.languages.length > 1
      ? `<details class="lang" data-lang-menu><summary aria-label="${esc(`${c.ui.language}: ${SITE_LOCALES[c.lang].name}`)}">${c.lang.toUpperCase()}</summary><ul>${i.languages
          .map(
            (l) =>
              `<li><a href="${esc(href(i, pagePath(i, l, current)))}" hreflang="${SITE_LOCALES[l].tag}" lang="${SITE_LOCALES[l].tag}" data-set-lang="${l}"${l === c.lang ? ' aria-current="true"' : ""}>${esc(SITE_LOCALES[l].name)}</a></li>`,
          )
          .join("")}</ul></details>`
      : "";
  return `<a class="skip" href="#main">${esc(c.ui.skip)}</a>
<header class="site-header"><div class="container bar">
<a class="brand" href="${esc(href(i, pagePath(i, c.lang, "")))}" aria-label="${esc(`${c.spec.siteName} — ${c.ui.home}`)}">${brand}</a>
<nav aria-label="${esc(c.ui.nav)}"><div class="nav-desktop"><ul>${items}</ul></div>
<details class="nav-mobile" data-nav><summary>${esc(c.ui.menu)}</summary><div class="panel"><ul>${items}</ul>${link(c, c.spec.primaryCta, "btn btn-primary")}</div></details></nav>
${langs}${link(c, c.spec.primaryCta, "btn btn-primary header-cta")}
</div></header>`;
}

function footerHtml(c: Ctx) {
  const i = c.input;
  const contact = c.spec.pages.flatMap((p) => p.sections).find((s): s is Extract<Section, { type: "contact" }> => s.type === "contact");
  const legalPrefix = i.basePath;
  const legal = [
    ["/privacy/", c.ui.privacy],
    ["/terms/", c.ui.terms],
    ["/cookies/", c.ui.cookies],
    ["/accessibility/", c.ui.accessibility],
  ]
    .map(([p, l]) => `<li><a href="${esc(`${legalPrefix}${p}`)}" hreflang="en">${esc(l)}</a></li>`)
    .join("");
  return `<footer class="site-footer"><div class="container"><div class="footer-grid">
<div><p style="font-family:var(--font-heading);font-size:1.25rem;margin-bottom:.4em">${esc(c.spec.siteName)}</p><p class="muted">${esc(c.spec.footerBlurb)}</p>
${contact ? `<ul>${contact.phone ? `<li><a href="tel:${esc(contact.phone.replace(/[^\d+]/g, ""))}">${esc(contact.phone)}</a></li>` : ""}${contact.email ? `<li><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>` : ""}${contact.address ? `<li>${esc(contact.address)}</li>` : ""}</ul>` : ""}</div>
<nav aria-label="${esc(c.ui.nav)} — footer"><ul>${c.spec.pages.map((p) => `<li><a href="${esc(href(i, pagePath(i, c.lang, p.slug)))}">${esc(p.navLabel)}</a></li>`).join("")}</ul></nav>
<div><ul>${legal}</ul>${c.lang !== "en" ? `<p class="muted" style="margin-top:8px;font-size:.9rem">${esc(c.ui.legalEnglish)}</p>` : ""}</div>
</div><p class="muted" style="margin-top:40px;font-size:.9rem">© ${i.year} ${esc(c.spec.siteName)}. ${esc(c.ui.rights)}</p></div></footer>`;
}

function fontLinks(spec: SiteSpec) {
  const fams = [...new Set([spec.theme.headingFont, spec.theme.bodyFont])].map((f) => FONTS[f]?.google).filter(Boolean);
  if (!fams.length) return "";
  return `<link rel="preconnect" href="https://fonts.bunny.net" crossorigin><link rel="stylesheet" href="https://fonts.bunny.net/css?family=${fams.join("|")}&amp;display=swap">`;
}

function headHtml(c: Ctx, o: { title: string; description: string; path: string; alternates: boolean; noindex?: boolean; ogImage?: string | null; jsonLd?: object | null }) {
  const i = c.input;
  const meta = SITE_LOCALES[c.lang];
  const slug = o.path;
  const alt = o.alternates
    ? i.languages.map((l) => `<link rel="alternate" hreflang="${SITE_LOCALES[l].tag}" href="${esc(abs(i, pagePath(i, l, slug)))}">`).join("") +
      `<link rel="alternate" hreflang="x-default" href="${esc(abs(i, pagePath(i, defaultLang(i), slug)))}">`
    : "";
  const canonical = o.alternates ? abs(i, pagePath(i, c.lang, slug)) : abs(i, slug);
  return `<!doctype html>
<html lang="${meta.tag}" dir="${meta.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${esc(canonical)}">
${alt}
${o.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta property="og:type" content="website"><meta property="og:site_name" content="${esc(c.spec.siteName)}"><meta property="og:title" content="${esc(o.title)}"><meta property="og:description" content="${esc(o.description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:locale" content="${meta.tag.replace("-", "_")}">
${o.ogImage ? `<meta property="og:image" content="${esc(o.ogImage)}"><meta name="twitter:card" content="summary_large_image">` : '<meta name="twitter:card" content="summary">'}
<meta name="theme-color" content="${esc(c.spec.theme.palette.background)}">
<meta name="generator" content="Maison Web Studio">
<meta name="maison-build" content="${esc(i.marker)}">
<link rel="icon" href="${esc(href(i, "/favicon.svg"))}" type="image/svg+xml">
${fontLinks(c.spec)}
<link rel="stylesheet" href="${esc(href(i, `/assets/site.css?v=${i.marker}`))}">
${o.jsonLd ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, "\\u003c")}</script>` : ""}
<script src="${esc(href(i, `/assets/site.js?v=${i.marker}`))}" defer></script>
</head>`;
}

function pageHtml(c: Ctx, page: Page, ogImage: string | null, jsonLd: object | null) {
  const first = page.sections[0];
  const pageHead = first?.type === "hero" ? "" : `<header class="page-head"><div class="container"><h1>${esc(page.navLabel || page.title)}</h1></div></header>`;
  const body = page.sections.map((s, idx) => section(c, s, idx, idx === 0)).join("\n");
  return `${headHtml(c, { title: page.title, description: page.description, path: page.slug, alternates: true, ogImage, jsonLd })}
<body data-default-lang="${defaultLang(c.input)}" data-lang="${c.lang}">
${headerHtml(c, page.slug)}
<main id="main" tabindex="-1">${pageHead}
${body}
</main>
${footerHtml(c)}
</body>
</html>`;
}

function simplePage(c: Ctx, title: string, inner: string, path: string, opts: { noindex?: boolean; lang?: string } = {}) {
  return `${headHtml(c, { title: `${title} — ${c.spec.siteName}`, description: c.spec.tagline, path, alternates: false, noindex: opts.noindex })}
<body data-default-lang="${defaultLang(c.input)}" data-lang="${c.lang}">
${headerHtml(c, "")}
<main id="main" tabindex="-1"${opts.lang ? ` lang="${opts.lang}"` : ""}><section class="sec"><div class="container">${inner}</div></section></main>
${footerHtml(c)}
</body>
</html>`;
}

function faviconSvg(spec: SiteSpec, palette: ReturnType<typeof resolvePalette>["palette"]) {
  const letter = (spec.siteName.trim()[0] ?? "M").toUpperCase().replace(/[<>&"']/g, "M");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${palette.primary}"/><text x="32" y="43" text-anchor="middle" font-family="Georgia, serif" font-size="34" fill="${palette.primaryText}">${letter}</text></svg>`;
}

/** Renders the complete static site (all languages) plus legal pages, 404, sitemap and robots. */
export function renderSite(input: RenderInput): RenderResult {
  const files: Record<string, SiteFile> = {};
  const fixes: string[] = [];
  const def = defaultLang(input);
  const base = input.specs[def];
  if (!base) throw new Error("Missing the default-language design.");
  const { palette, fixes: paletteFixes } = resolvePalette(base.theme.palette);
  fixes.push(...paletteFixes);
  const assets = new Map(input.assets.map((a) => [a.id, a]));

  files["/assets/site.css"] = { body: `${BASE_CSS}\n${themeCss(base, palette)}\n/* custom */\n${base.customCss}`, type: "text/css; charset=utf-8" };
  files["/assets/site.js"] = { body: SITE_JS, type: "text/javascript; charset=utf-8" };
  files["/favicon.svg"] = { body: faviconSvg(base, palette), type: "image/svg+xml" };
  for (const a of input.assets) if (a.bytes && a.role !== "inspiration" && a.role !== "document") files[assetPath(a)] = { body: a.bytes, type: a.mime };

  // Social preview: the first hero image (falls back to the logo).
  const heroImg = base.pages.flatMap((p) => p.sections).find((s): s is Extract<Section, { type: "hero" }> => s.type === "hero" && !!s.image)?.image ?? base.logo;
  const ogAsset = heroImg ? assets.get(heroImg) : undefined;
  const ogImage = ogAsset?.bytes && /png|jpe?g|webp/.test(ogAsset.mime) ? abs(input, assetPath(ogAsset)) : null;

  for (const lang of input.languages) {
    const spec = input.specs[lang] ?? base;
    const c: Ctx = { lang, spec: { ...spec, theme: base.theme, logo: base.logo, customCss: base.customCss }, input, assets, ui: UI_STRINGS[lang] };
    const contact = spec.pages.flatMap((p) => p.sections).find((s): s is Extract<Section, { type: "contact" }> => s.type === "contact");
    for (const page of spec.pages) {
      const jsonLd =
        page.slug === ""
          ? {
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: spec.siteName,
              description: spec.tagline,
              url: abs(input, pagePath(input, lang, "")),
              ...(contact?.phone ? { telephone: contact.phone } : {}),
              ...(contact?.email ? { email: contact.email } : {}),
              ...(contact?.address ? { address: contact.address } : {}),
              ...(ogImage ? { image: ogImage } : {}),
            }
          : null;
      files[`${pagePath(input, lang, page.slug)}index.html`] = { body: pageHtml(c, page, ogImage, jsonLd), type: "text/html; charset=utf-8" };
    }
    const u = UI_STRINGS[lang];
    const home = href(input, pagePath(input, lang, ""));
    files[`${prefix(input, lang)}/thanks/index.html`] = { body: simplePage(c, u.thanksTitle, `<h1>${esc(u.thanksTitle)}</h1><p>${esc(u.thanksBody)}</p><p><a class="btn btn-primary" href="${esc(home)}">${esc(u.backHome)}</a></p>`, `${prefix(input, lang)}/thanks/`, { noindex: true }), type: "text/html; charset=utf-8" };
    files[`${prefix(input, lang)}/form-error/index.html`] = { body: simplePage(c, u.errorTitle, `<h1>${esc(u.errorTitle)}</h1><p>${esc(u.errorBody)}</p><p><a class="btn btn-primary" href="${esc(home)}">${esc(u.backHome)}</a></p>`, `${prefix(input, lang)}/form-error/`, { noindex: true }), type: "text/html; charset=utf-8" };
  }

  // 404 (default language) and English legal pages (flagged as templates for legal review).
  const dc: Ctx = { lang: def, spec: base, input, assets, ui: UI_STRINGS[def] };
  const u = UI_STRINGS[def];
  files["/404.html"] = { body: simplePage(dc, u.notFoundTitle, `<p class="eyebrow">404</p><h1>${esc(u.notFoundTitle)}</h1><p>${esc(u.notFoundBody)}</p><p><a class="btn btn-primary" href="${esc(href(input, "/"))}">${esc(u.backHome)}</a></p>`, "/404", { noindex: true }), type: "text/html; charset=utf-8" };
  for (const doc of legalPages(input.legal)) {
    files[`/${doc.slug}/index.html`] = {
      body: simplePage(dc, doc.title, `<article class="legal" lang="en" dir="ltr"><h1>${esc(doc.title)}</h1><p class="legal-note"><strong>Template for review.</strong> Prepared by Maison Web Studio from how this website works. It must be reviewed by the business owner and a qualified legal advisor; it is not legal advice and does not guarantee legal compliance.</p><p class="muted">Last updated: ${esc(doc.updated)}</p>${doc.html}</article>`, `/${doc.slug}/`),
      type: "text/html; charset=utf-8",
    };
  }

  // sitemap.xml (content pages only) with hreflang alternates; robots.txt.
  const urls = base.pages
    .map((p) =>
      input.languages
        .map((l) => {
          const alts = input.languages.map((a) => `<xhtml:link rel="alternate" hreflang="${SITE_LOCALES[a].tag}" href="${esc(abs(input, pagePath(input, a, p.slug)))}"/>`).join("");
          return `<url><loc>${esc(abs(input, pagePath(input, l, p.slug)))}</loc>${input.languages.length > 1 ? alts : ""}</url>`;
        })
        .join(""),
    )
    .join("\n");
  const legalUrls = ["privacy", "terms", "cookies", "accessibility"].map((s) => `<url><loc>${esc(abs(input, `/${s}/`))}</loc></url>`).join("\n");
  files["/sitemap.xml"] = { body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n${legalUrls}\n</urlset>\n`, type: "application/xml" };
  files["/robots.txt"] = { body: `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /thanks/\nDisallow: /form-error/\n\nSitemap: ${abs(input, "/sitemap.xml")}\n`, type: "text/plain; charset=utf-8" };
  return { files, fixes, palette };
}

/** Security and caching headers for the deployed site (Workers Static Assets `_headers` format). */
export const HEADERS_FILE = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.bunny.net; font-src https://fonts.bunny.net; img-src 'self' data:; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000
  Cross-Origin-Opener-Policy: same-origin
/assets/img/*
  Cache-Control: public, max-age=31536000, immutable
`;
