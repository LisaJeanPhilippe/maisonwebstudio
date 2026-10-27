import type { Metadata } from "next";
import { ConfiguratorLoader } from "@/components/start/configurator-loader";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/start">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/start", title: m.meta.start.title, description: m.meta.start.description });
}

export default function StartPage() {
  return <ConfiguratorLoader />;
}
