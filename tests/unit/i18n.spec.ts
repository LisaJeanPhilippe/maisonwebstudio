import { expect, test } from "@playwright/test";
import { LOCALES, LOCALE_META, localizePath, splitLocale } from "@/i18n/config";
import { formatPrice, plur } from "@/i18n/format";
import { getMessages as load } from "@/i18n/messages";
import en from "@/i18n/messages/en";

type Node = unknown;
// The test runner compiles to CommonJS, which wraps dynamic imports in an extra `default`.
const getMessages = async (locale: (typeof LOCALES)[number]) => {
  const m = (await load(locale)) as typeof en & { default?: typeof en };
  return m.default ?? m;
};
const isPlural = (v: Node) => !!v && typeof v === "object" && !Array.isArray(v) && "other" in (v as object) && Object.keys(v as object).every((k) => ["zero", "one", "two", "few", "many", "other"].includes(k));
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

/** Walks the English dictionary and checks the translation has the same shape and placeholders. */
function compare(source: Node, target: Node, path: string, problems: string[]) {
  if (typeof source === "string") {
    if (typeof target !== "string") return void problems.push(`${path}: expected string`);
    if (!target.trim()) problems.push(`${path}: empty`);
    if (placeholders(source) !== placeholders(target)) problems.push(`${path}: placeholders {${placeholders(source)}} vs {${placeholders(target)}}`);
    return;
  }
  if (isPlural(source)) {
    if (!isPlural(target)) return void problems.push(`${path}: expected plural forms`);
    const want = placeholders((source as Record<string, string>).other);
    for (const [form, text] of Object.entries(target as Record<string, string>)) {
      // A form may drop {count} when the count is implied by the word (Arabic "one"/"two", "zero").
      const got = placeholders(text);
      if (got && got !== want) problems.push(`${path}.${form}: placeholders {${got}} vs {${want}}`);
    }
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(target) || target.length !== source.length) return void problems.push(`${path}: array length differs`);
    source.forEach((s, i) => compare(s, target[i], `${path}[${i}]`, problems));
    return;
  }
  if (source && typeof source === "object") {
    if (!target || typeof target !== "object") return void problems.push(`${path}: expected object`);
    for (const key of Object.keys(source)) compare((source as Record<string, Node>)[key], (target as Record<string, Node>)[key], `${path}.${key}`, problems);
    for (const key of Object.keys(target)) if (!(key in source)) problems.push(`${path}.${key}: not in English source`);
  }
}

for (const locale of LOCALES) {
  test(`dictionary "${locale}" is complete and keeps placeholders`, async () => {
    const messages = await getMessages(locale);
    const problems: string[] = [];
    compare(en, messages, locale, problems);
    expect(problems).toEqual([]);
    if (locale !== "en") expect(messages.hero.headline).not.toBe(en.hero.headline);
  });
}

test("plural rules pick the right Arabic and Russian forms", async () => {
  const ar = await getMessages("ar");
  expect(plur("ar", ar.success.files, 1)).toBe("ملف واحد");
  expect(plur("ar", ar.success.files, 2)).toBe("ملفان");
  expect(plur("ar", ar.success.files, 3)).toContain("ملفات");
  const ru = await getMessages("ru");
  const five = plur("ru", ru.success.files, 5);
  const one = plur("ru", ru.success.files, 1);
  expect(five).not.toBe(one.replace("1", "5"));
});

test("prices are always USD, formatted per locale", () => {
  for (const locale of LOCALES) expect(formatPrice(locale, 1499)).toContain("$");
  expect(formatPrice("en", 1499)).toBe("$1,499");
});

test("locale paths", () => {
  expect(localizePath("en", "/pricing")).toBe("/pricing");
  expect(localizePath("ar", "/pricing")).toBe("/ar/pricing");
  expect(splitLocale("/es/work/solace")).toMatchObject({ locale: "es" });
  expect(LOCALE_META.ar.dir).toBe("rtl");
  expect(LOCALE_META.zh.tag).toBe("zh-Hans");
});
