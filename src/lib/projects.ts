export const CATEGORIES = ["All", "Beauty", "Restaurant", "Professional Services", "E-Commerce", "Local Business"] as const;
export type Category = (typeof CATEGORIES)[number];

export type ProjectSlug = "aurelia-skin" | "maison-noir" | "form-studio" | "solace" | "mason-and-co";

export type Project = {
  slug: ProjectSlug;
  name: string;
  categories: Exclude<Category, "All">[];
  domain: string;
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
    categories: ["Beauty", "E-Commerce"],
    domain: "aureliaskin.com",
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
    categories: ["Restaurant", "Local Business"],
    domain: "maisonnoir.nyc",
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
    categories: ["Professional Services", "Local Business"],
    domain: "formstudio.co",
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
    categories: ["Local Business", "Beauty"],
    domain: "solace.studio",
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
    categories: ["Professional Services"],
    domain: "masonandco.com",
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
