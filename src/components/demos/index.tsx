import type { ComponentType } from "react";
import type { ProjectSlug } from "@/lib/projects";
import { AureliaDemo } from "./aurelia";
import { FormStudioDemo } from "./form-studio";
import { MaisonNoirDemo } from "./maison-noir";
import { MasonCoDemo } from "./mason-co";
import { SolaceDemo } from "./solace";

export const DEMOS: Record<ProjectSlug, ComponentType> = {
  "aurelia-skin": AureliaDemo,
  "maison-noir": MaisonNoirDemo,
  "form-studio": FormStudioDemo,
  solace: SolaceDemo,
  "mason-and-co": MasonCoDemo,
};
