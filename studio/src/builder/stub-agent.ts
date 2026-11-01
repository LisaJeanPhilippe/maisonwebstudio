import type { DesignInput, ReviseInput, TranslateInput, WebsiteAgent } from "./agent";
import { slugify, type Section, type SiteSpec } from "./spec";

/**
 * Deterministic, offline stand-in for the Claude website agent — development and tests ONLY
 * (DEV_AI_PROVIDER=stub, ignored in production). It assembles a site from the customer's own
 * brief text without calling any AI, so the full pipeline can be exercised without an API key.
 */
type Brief = {
  business: { name: string; description: string; location: string; phone: string; publicContact: string };
  goals: { purpose: string; primaryCta: string; primaryCtaId: string };
  pages: string[];
  design: { direction: string };
  functionality: { features: string[]; toolLinks: string };
  content: { about: string; services: string; testimonials: string; faq: string; pricing: string };
};

const lines = (s: string) => s.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

export class StubWebsiteAgent implements WebsiteAgent {
  readonly name = "stub";

  async design(input: DesignInput): Promise<SiteSpec> {
    const b = input.brief as Brief;
    const photos = input.assetList.filter((a) => a.role === "photo");
    const logo = input.assetList.find((a) => a.role === "logo");
    const formKind = ({ book: "booking", quote: "quote", order: "order" } as Record<string, "booking" | "quote" | "order">)[b.goals.primaryCtaId] ?? "contact";
    const contact: Section = {
      type: "contact",
      id: "contact",
      heading: "Get in touch",
      intro: `Reach ${b.business.name} using the form or the details below.`,
      form: formKind,
      address: b.business.location || null,
      phone: b.business.phone || null,
      email: null,
      hours: lines(b.business.publicContact).filter((l) => /\d/.test(l) && /(am|pm|mon|tue|wed|thu|fri|sat|sun|:)/i.test(l)).slice(0, 7),
      mapQuery: b.business.location || null,
    };
    const ctaTarget = /^https:\/\//.test(lines(b.functionality.toolLinks)[0] ?? "") ? lines(b.functionality.toolLinks)[0] : "section:contact";
    const primaryCta = { label: b.goals.primaryCta || "Contact us", target: ctaTarget };
    const services = lines(b.content.services).slice(0, 8).map((l) => {
      const [title, ...rest] = l.split(/\s[-–—:]\s/);
      return { title: title.slice(0, 80), body: rest.join(" — ") || `${title} by ${b.business.name}.`, price: null };
    });
    const testimonials = lines(b.content.testimonials)
      .map((l) => l.match(/^["“]?(.+?)["”]?\s*[-–—]\s*(.+)$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .slice(0, 3)
      .map((m) => ({ quote: m[1], author: m[2] }));
    const faq = lines(b.content.faq)
      .map((l) => l.split(/\?\s*/))
      .filter((p) => p.length > 1 && p[1])
      .slice(0, 6)
      .map((p) => ({ question: `${p[0]}?`, answer: p.slice(1).join("? ") }));

    const homeSections: Section[] = [
      {
        type: "hero",
        id: "top",
        variant: photos[0] ? "split" : "centered",
        eyebrow: b.business.location || null,
        heading: b.business.name,
        subheading: (b.business.description || b.goals.purpose).slice(0, 220),
        image: photos[0]?.id ?? null,
        imageAlt: photos[0] ? `${b.business.name}` : null,
        primaryCta,
        secondaryCta: null,
      },
    ];
    if (services.length) homeSections.push({ type: "features", id: "services", heading: "Services", intro: null, columns: services.length % 3 === 0 ? "3" : "2", items: services });
    if (testimonials.length) homeSections.push({ type: "testimonials", id: "reviews", heading: "What clients say", items: testimonials });
    homeSections.push({ type: "cta", id: "cta", heading: `Ready when you are`, body: b.goals.purpose.slice(0, 160) || null, cta: primaryCta });

    const pages: SiteSpec["pages"] = [
      { slug: "", navLabel: "Home", title: `${b.business.name}`.slice(0, 58), description: (b.business.description || b.goals.purpose).padEnd(80, ".").slice(0, 155), sections: homeSections },
    ];
    const wanted = b.pages.map((p) => p.toLowerCase());
    if (wanted.some((p) => /about/.test(p)))
      pages.push({
        slug: "about",
        navLabel: "About",
        title: `About ${b.business.name}`.slice(0, 58),
        description: `Learn about ${b.business.name}${b.business.location ? ` in ${b.business.location}` : ""}: who we are and how we work.`.slice(0, 155),
        sections: [
          photos[1]
            ? { type: "imageText", id: "story", heading: "Our story", paragraphs: lines(b.content.about || b.business.description).slice(0, 4), image: photos[1].id, imageAlt: `Inside ${b.business.name}`, imageSide: "end", cta: null }
            : { type: "text", id: "story", eyebrow: null, heading: "Our story", paragraphs: lines(b.content.about || b.business.description).slice(0, 4) },
          { type: "cta", id: "about-cta", heading: "Come and see us", body: null, cta: primaryCta },
        ],
      });
    if (faq.length) pages.push({ slug: "faq", navLabel: "FAQ", title: `FAQ — ${b.business.name}`.slice(0, 58), description: `Answers to common questions about ${b.business.name}, our services and how to book.`, sections: [{ type: "faq", id: "questions", heading: "Questions & answers", items: faq }] });
    pages.push({ slug: "contact", navLabel: "Contact", title: `Contact ${b.business.name}`.slice(0, 58), description: `Contact ${b.business.name}${b.business.location ? ` in ${b.business.location}` : ""} — send a message or find our details.`, sections: [contact] });

    const style = (["minimal", "editorial", "warm", "bold"].includes(b.design.direction) ? b.design.direction : "minimal") as SiteSpec["theme"]["style"];
    return {
      siteName: b.business.name,
      tagline: (b.business.description || b.goals.purpose).slice(0, 140),
      theme: {
        style,
        palette: { background: "#faf8f5", surface: "#ffffff", text: "#1c1a17", muted: "#5d5850", primary: "#2f4a3a", primaryText: "#ffffff", accent: "#c9a46b", border: "#e4dfd6" },
        headingFont: style === "editorial" ? "playfair-display" : "dm-sans",
        bodyFont: "inter",
        radius: style === "bold" ? "none" : "soft",
        density: "balanced",
        headingCase: "normal",
      },
      logo: logo?.id ?? null,
      primaryCta,
      pages: pages.map((p) => ({ ...p, slug: p.slug ? slugify(p.slug) : "" })),
      footerBlurb: (b.business.description || "").slice(0, 160),
      customCss: "",
      designNotes: "Offline stand-in design assembled from the brief (development/testing only — no AI was used).",
    };
  }

  async revise(input: ReviseInput): Promise<SiteSpec> {
    const s = structuredClone(input.current);
    const i = input.instruction.toLowerCase();
    if (/luxur|elegan|premium/.test(i)) Object.assign(s.theme, { style: "luxury", headingFont: "cormorant-garamond", palette: { ...s.theme.palette, background: "#f6f1ea", primary: "#1f1a17", accent: "#b08d57" } });
    if (/whitespace|spacious|airy|space/.test(i)) s.theme.density = "airy";
    if (/bold|modern/.test(i)) Object.assign(s.theme, { style: "bold", headingFont: "space-grotesk" });
    if (/typograph|font/.test(i)) s.theme.headingFont = s.theme.headingFont === "fraunces" ? "manrope" : "fraunces";
    if (/button|cta|prominent/.test(i)) s.pages[0].sections = s.pages[0].sections.map((x) => (x.type === "hero" ? { ...x, secondaryCta: null } : x));
    if (/services/.test(i) && !s.pages[0].sections.some((x) => x.id === "more-services"))
      s.pages[0].sections.splice(1, 0, { type: "steps", id: "more-services", heading: "How it works", items: [{ title: "Get in touch", body: "Tell us what you need." }, { title: "We confirm", body: "We reply with the details." }] });
    s.designNotes = `Offline stand-in revision for: "${input.instruction.slice(0, 120)}" (development/testing only — no AI was used).`;
    return s;
  }

  async translate(input: TranslateInput) {
    // The stub doesn't translate: it returns the source text, so pages stay honest about it.
    return input.strings;
  }
}
