import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { accessibilityStatement } from "@/content/legal/accessibility";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/accessibility">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/accessibility", title: m.meta.accessibility.title, description: m.meta.accessibility.description });
}

export default async function Page({ params }: PageProps<"/[lang]/accessibility">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return <LegalPage locale={locale} m={m} title={m.meta.accessibility.title} doc={accessibilityStatement()} />;
}
