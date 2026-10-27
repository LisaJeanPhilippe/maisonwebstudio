import { LOCALE_META, type Locale } from "./config";

export type Plural = { other: string } & Partial<Record<Exclude<Intl.LDMLPluralRule, "other">, string>>;

/** Identity helper so plural messages get the Plural type in dictionaries. */
export const plural = (forms: Plural): Plural => forms;

/** Replaces {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in vars ? String(vars[key]) : whole,
  );
}

const pluralRules = new Map<string, Intl.PluralRules>();

/** Picks the right plural form for the locale and fills in {count}. */
export function plur(locale: Locale, forms: Plural, count: number, vars: Record<string, string | number> = {}) {
  const tag = LOCALE_META[locale].tag;
  let rules = pluralRules.get(tag);
  if (!rules) pluralRules.set(tag, (rules = new Intl.PluralRules(tag)));
  const form = (count === 0 && forms.zero) || forms[rules.select(count)] || forms.other;
  return fmt(form, { count: formatNumber(locale, count), ...vars });
}

export function formatNumber(locale: Locale, value: number): string {
  return new Intl.NumberFormat(LOCALE_META[locale].tag).format(value);
}

/** Prices are always charged in US dollars; only the formatting is localized. */
export function formatPrice(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(LOCALE_META[locale].tag, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(locale: Locale, date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE_META[locale].tag, { dateStyle: "long", timeZone: "UTC" }).format(
    typeof date === "string" ? new Date(date) : date,
  );
}
