import type { Metadata } from "next";
import { SelectedWork } from "@/components/site/selected-work";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/work">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/work", title: m.meta.work.title, description: m.meta.work.description });
}

export default async function WorkPage({ params }: PageProps<"/[lang]/work">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-20 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">{m.work.eyebrow}</p>
          <h1 className="max-w-[14ch] text-display font-medium text-balance">{m.work.title}</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">{m.work.lede}</p>
        </Reveal>
      </section>
      <section className="container-page pb-[var(--space-section)]" aria-label={m.work.eyebrow}>
        <SelectedWork />
      </section>
      <CtaBand locale={locale} m={m} title={m.work.ctaTitle} />
    </>
  );
}
