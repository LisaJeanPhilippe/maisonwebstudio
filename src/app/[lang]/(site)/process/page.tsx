import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/process">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/process", title: m.meta.process.title, description: m.meta.process.description });
}

export default async function ProcessPage({ params }: PageProps<"/[lang]/process">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">{m.process.page.eyebrow}</p>
          <h1 className="max-w-[14ch] text-display font-medium text-balance">{m.process.page.title}</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">{m.process.page.lede}</p>
        </Reveal>
      </section>

      <section className="container-page pb-[var(--space-section)]" aria-label={m.process.page.eyebrow}>
        <ol>
          {m.process.steps.map((step, i) => (
            <li key={step.title} className="border-t border-line">
              <Reveal delay={i * 0.04} className="grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                <span aria-hidden className="text-[clamp(3rem,2rem+4vw,6rem)] font-medium leading-none tracking-[-0.06em] text-ink/15 md:col-span-3">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:col-span-4">
                  <h2 className="text-title font-medium">{step.title}</h2>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">{step.duration}</p>
                </div>
                <p className="max-w-lg text-[16.5px] leading-relaxed text-muted md:col-span-5">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface" aria-label={m.process.extras[0].t}>
        <ul className="container-page section-y grid gap-12 md:grid-cols-3">
          {m.process.extras.map(({ t, d }, i) => (
            <li key={t}>
              <Reveal delay={i * 0.06}>
                <h2 className="text-[1.375rem] font-medium tracking-[-0.03em]">{t}</h2>
                <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{d}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
      <CtaBand locale={locale} m={m} />
    </>
  );
}
