"use client";

import NextLink from "next/link";
import { createContext, useContext, type ComponentProps } from "react";
import { LOCALE_META, localizePath, type Locale } from "./config";
import type { ClientMessages } from "./messages";

type I18nValue = { locale: Locale; m: ClientMessages };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, messages, children }: { locale: Locale; messages: ClientMessages; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, m: messages }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return { ...value, dir: LOCALE_META[value.locale].dir };
}

/** next/link that keeps the visitor in their current language. */
export function LocaleLink({ href, ...props }: Omit<ComponentProps<typeof NextLink>, "href"> & { href: string }) {
  const { locale } = useI18n();
  return <NextLink href={localizePath(locale, href)} {...props} />;
}
