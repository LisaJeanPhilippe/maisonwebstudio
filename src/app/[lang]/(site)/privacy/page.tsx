import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { privacyPolicy } from "@/content/legal/privacy";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/privacy", title: m.meta.privacy.title, description: m.meta.privacy.description });
}

export default async function Page({ params }: PageProps<"/[lang]/privacy">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return <LegalPage locale={locale} m={m} title={m.meta.privacy.title} doc={privacyPolicy()} />;
}
