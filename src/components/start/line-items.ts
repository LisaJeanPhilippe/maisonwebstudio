import type { LineItem } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { plur } from "@/i18n/format";
import type { ClientMessages } from "@/i18n/messages";

/** Customer-facing name for a priced line item, in the visitor's language. */
export function lineItemName(locale: Locale, m: Pick<ClientMessages, "packages" | "addOns" | "extraPagesItem">, item: LineItem) {
  if (item.id in m.packages) return m.packages[item.id as keyof typeof m.packages].name;
  if (item.id === "extra-pages") return plur(locale, m.extraPagesItem, item.quantity);
  return m.addOns[item.id as keyof typeof m.addOns]?.name ?? item.name;
}
