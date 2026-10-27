import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { termsAndConditions } from "@/content/legal/terms";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/terms">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/terms", title: m.meta.terms.title, description: m.meta.terms.description });
}

export default async function Page({ params }: PageProps<"/[lang]/terms">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return <LegalPage locale={locale} m={m} title={m.meta.terms.title} doc={termsAndConditions()} />;
}
