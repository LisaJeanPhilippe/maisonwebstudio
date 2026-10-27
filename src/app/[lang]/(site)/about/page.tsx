import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { BrowserFrame } from "@/components/mockups/frames";
import { FormStudioDemo } from "@/components/demos/form-studio";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/about", title: m.meta.about.title, description: m.meta.about.description });
}

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return (
    <>
      <section className="container-page pb-16 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">{m.about.eyebrow}</p>
          <h1 className="max-w-[16ch] text-display font-medium text-balance">{m.about.title}</h1>
        </Reveal>
        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12">
          <Reveal className="md:col-span-5 md:col-start-2" delay={0.1}>
            <p className="text-lede text-ink-soft">{m.about.intro}</p>
          </Reveal>
          <Reveal className="space-y-5 text-[16px] leading-relaxed text-muted md:col-span-5" delay={0.15}>
            <p>{m.about.p1}</p>
            <p>{m.about.p2}</p>
          </Reveal>
        </div>
      </section>

      <section className="container-page">
        <Reveal>
          <div role="img" aria-label={m.about.showcaseLabel} className="overflow-hidden rounded-[var(--radius-media)] bg-[#ddd6cb] px-[6%] pt-[6%]">
            <BrowserFrame url="formstudio.co" className="rounded-b-none border-b-0" aspect="aspect-[16/8]">
              <FormStudioDemo />
            </BrowserFrame>
          </div>
        </Reveal>
      </section>

      <section className="container-page section-y" aria-labelledby="values-title">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="eyebrow mb-6">{m.about.valuesEyebrow}</p>
            <h2 id="values-title" className="text-headline font-medium">{m.about.valuesTitle}</h2>
          </Reveal>
          <ul className="grid gap-x-12 gap-y-12 sm:grid-cols-2 md:col-span-8">
            {m.about.values.map(({ t, d }, i) => (
              <li key={t}>
                <Reveal delay={i * 0.06} className="border-t border-line pt-6">
                  <h3 className="text-[1.375rem] font-medium tracking-[-0.03em]">{t}</h3>
                  <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{d}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <CtaBand locale={locale} m={m} />
    </>
  );
}
