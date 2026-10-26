export const CATEGORIES = ["All", "Beauty", "Restaurant", "Professional Services", "E-Commerce", "Local Business"] as const;
export type Category = (typeof CATEGORIES)[number];

export type ProjectSlug = "aurelia-skin" | "maison-noir" | "form-studio" | "solace" | "mason-and-co";

export type Project = {
  slug: ProjectSlug;
  name: string;
  industry: string;
  categories: Exclude<Category, "All">[];
  domain: string;
  summary: string;
  description: string;
  challenge: string;
  approach: string;
  features: string[];
  /** Design highlights (sample projects — not client performance claims). */
  highlights: { value: string; label: string }[];
  package: "starter" | "business" | "premium";
  /** Colors used for the card surround + case study accents. */
  surface: string;
  screen: string;
  ink: "light" | "dark";
  palette: string[];
  typefaces: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "aurelia-skin",
    name: "Aurelia Skin",
    industry: "Beauty / E-Commerce",
    categories: ["Beauty", "E-Commerce"],
    domain: "aureliaskin.com",
    summary: "A soft, editorial storefront for a clinical-meets-gentle skincare line.",
    description:
      "Aurelia needed a storefront that felt as considered as its formulas. We designed an editorial shopping experience with tactile product presentation, a guided skin quiz, and a checkout tuned for repeat purchases.",
    challenge:
      "Their previous theme looked like every other skincare brand and buried the bestsellers three clicks deep.",
    approach:
      "We led with a single ritual, gave every product room to breathe, and wrote merchandising around ingredients rather than discounts.",
    features: ["Shopify storefront", "Skin quiz", "Subscriptions", "Reviews", "Email capture"],
    highlights: [
      { value: "3-step", label: "Guided skin quiz" },
      { value: "1 tap", label: "From product to bag" },
      { value: "< 1.5s", label: "Load-time target" },
    ],
    package: "premium",
    surface: "#efe4dc",
    screen: "#f5eee8",
    ink: "dark",
    palette: ["#f5eee8", "#e3b99c", "#b07c62", "#3a2e2a"],
    typefaces: "Cormorant Garamond · Geist",
  },
  {
    slug: "maison-noir",
    name: "Maison Noir",
    industry: "Restaurant",
    categories: ["Restaurant", "Local Business"],
    domain: "maisonnoir.nyc",
    summary: "A candlelit, after-dark site with reservations front and center.",
    description:
      "An intimate French dining room deserved a site that set the mood before guests walked in. We built a dark, cinematic experience with an always-visible reservation flow and a menu that updates in minutes.",
    challenge: "Reservations were handled by phone and a PDF menu that was always out of date.",
    approach:
      "A reservation widget in the hero, an editable seasonal menu, and private dining inquiries routed straight to the events team.",
    features: ["Reservations", "Editable menu", "Private dining inquiries", "Gift cards", "Google Maps"],
    highlights: [
      { value: "Hero", label: "Reservation widget placement" },
      { value: "Minutes", label: "To update the seasonal menu" },
      { value: "Dark", label: "Cinematic, after-hours palette" },
    ],
    package: "business",
    surface: "#1d1a17",
    screen: "#12100e",
    ink: "light",
    palette: ["#12100e", "#ede6da", "#d9c39b", "#6b1a24"],
    typefaces: "Instrument Serif · Geist",
  },
  {
    slug: "form-studio",
    name: "Form Studio",
    industry: "Interior Design",
    categories: ["Professional Services", "Local Business"],
    domain: "formstudio.co",
    summary: "A quiet, architectural portfolio that lets the spaces do the talking.",
    description:
      "Form Studio's work is about proportion and restraint, so the site is too. A modular grid, a project index, and image-led case studies that make each commission feel like a magazine feature.",
    challenge: "Beautiful projects, but a cluttered gallery that made every space look the same.",
    approach:
      "We built a flexible grid system and an indexed project list, giving each project its own rhythm of imagery and text.",
    features: ["Project index", "Case study templates", "Journal", "Inquiry form", "CMS"],
    highlights: [
      { value: "12", label: "Page templates" },
      { value: "Modular", label: "Image grid system" },
      { value: "Indexed", label: "Project archive" },
    ],
    package: "premium",
    surface: "#ddd6cb",
    screen: "#e9e4dc",
    ink: "dark",
    palette: ["#e9e4dc", "#b8a993", "#b4693f", "#1e1d1b"],
    typefaces: "Geist · Geist Mono",
  },
  {
    slug: "solace",
    name: "Solace",
    industry: "Wellness",
    categories: ["Local Business", "Beauty"],
    domain: "solace.studio",
    summary: "A calm, rounded booking experience for a yoga and breathwork studio.",
    description:
      "Solace wanted a site that felt like walking into the studio. Soft forms, a gentle palette, and a class schedule that makes booking a first visit effortless on any phone.",
    challenge: "Most visitors arrived on mobile and dropped off inside a clunky third-party schedule.",
    approach:
      "A native-feeling schedule, a clear intro offer, and booking integrated directly into the design system.",
    features: ["Class schedule", "Booking integration", "Intro offer funnel", "Memberships", "Newsletter"],
    highlights: [
      { value: "Mobile", label: "First design approach" },
      { value: "2 taps", label: "To reserve a class" },
      { value: "Built-in", label: "Intro offer funnel" },
    ],
    package: "business",
    surface: "#dfe3d8",
    screen: "#eef0ea",
    ink: "dark",
    palette: ["#eef0ea", "#dfe3d6", "#6e7b63", "#2c3328"],
    typefaces: "Fraunces · Geist",
  },
  {
    slug: "mason-and-co",
    name: "Mason & Co.",
    industry: "Professional Services",
    categories: ["Professional Services"],
    domain: "masonandco.com",
    summary: "A confident, trustworthy presence for a multi-generational advisory firm.",
    description:
      "After 35 years of referrals, Mason & Co. needed a site that matched their reputation. We created a measured, editorial design with clear practice areas and a frictionless consultation booking.",
    challenge: "An outdated site that undersold decades of expertise and generated almost no leads.",
    approach:
      "Lead with credibility — proof points, real people, plain-spoken practice pages — and make booking a consultation one click from anywhere.",
    features: ["Consultation booking", "Practice area pages", "Team profiles", "Insights blog", "Analytics"],
    highlights: [
      { value: "7", label: "Pages" },
      { value: "1 click", label: "To book a consultation" },
      { value: "Editorial", label: "Insights blog" },
    ],
    package: "business",
    surface: "#e3e7e1",
    screen: "#fbfaf7",
    ink: "dark",
    palette: ["#fbfaf7", "#e8e4da", "#2f4a3f", "#14211c"],
    typefaces: "Instrument Serif · Geist",
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
