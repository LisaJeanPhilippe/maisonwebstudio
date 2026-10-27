import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { cookiePolicy } from "@/content/legal/cookies";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/cookies">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/cookies", title: m.meta.cookies.title, description: m.meta.cookies.description });
}

export default async function Page({ params }: PageProps<"/[lang]/cookies">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return <LegalPage locale={locale} m={m} title={m.meta.cookies.title} doc={cookiePolicy()} />;
}
