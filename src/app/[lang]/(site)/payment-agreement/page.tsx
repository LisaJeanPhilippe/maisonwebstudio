import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal-page";
import { paymentPolicy } from "@/content/legal/payment";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/payment-agreement">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/payment-agreement", title: m.meta.payment.title, description: m.meta.payment.description });
}

export default async function Page({ params }: PageProps<"/[lang]/payment-agreement">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return <LegalPage locale={locale} m={m} title={m.meta.payment.title} doc={paymentPolicy()} />;
}
