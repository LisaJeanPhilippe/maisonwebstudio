import type { Locale } from "../config";
import type { Messages } from "./en";

export type { Messages };

const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./en"),
  zh: () => import("./zh"),
  es: () => import("./es"),
  hi: () => import("./hi"),
  ar: () => import("./ar"),
  fr: () => import("./fr"),
  bn: () => import("./bn"),
  pt: () => import("./pt"),
  ru: () => import("./ru"),
  id: () => import("./id"),
};

export async function getMessages(locale: Locale): Promise<Messages> {
  return (await loaders[locale]()).default;
}

/** Namespaces needed by client components; everything else stays on the server. */
export const CLIENT_NAMESPACES = [
  "common",
  "nav",
  "language",
  "hero",
  "work",
  "projects",
  "caseStudy",
  "configurator",
  "validation",
  "packages",
  "addOns",
  "extraPagesItem",
  "styles",
  "industries",
  "pageNames",
  "error",
  "notFound",
] as const satisfies readonly (keyof Messages)[];

export type ClientMessages = Pick<Messages, (typeof CLIENT_NAMESPACES)[number]>;

export function pickClientMessages(messages: Messages): ClientMessages {
  return Object.fromEntries(CLIENT_NAMESPACES.map((k) => [k, messages[k]])) as ClientMessages;
}
