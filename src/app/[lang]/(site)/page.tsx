import type { Metadata } from "next";
import { Hero } from "@/components/site/hero";
import { IndustriesMarquee } from "@/components/site/industries-marquee";
import { SelectedWork } from "@/components/site/selected-work";
import { ServicesList } from "@/components/site/services-list";
import { ProcessSteps } from "@/components/site/process-steps";
import { PricingCards } from "@/components/site/pricing-cards";
import { FaqList } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { JsonLd, organizationJsonLd } from "@/components/site/json-ld";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/", title: m.meta.home.title, description: m.meta.home.description, absoluteTitle: true });
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);

  return (
    <>
      <JsonLd data={organizationJsonLd(locale, m.meta.home.description)} />
      <Hero />

      <IndustriesMarquee
        items={m.home.industries}
        label={m.home.industriesLabel}
        pauseLabel={m.home.pauseAnimation}
        playLabel={m.home.playAnimation}
      />

      <section id="work" className="container-page section-y" aria-labelledby="work-title">
        <SectionHeading
          id="work-title"
          eyebrow={m.home.work.eyebrow}
          title={m.home.work.title}
          description={m.home.work.description}
          action={<ButtonLink href="/work" variant="secondary" arrow>{m.common.allWork}</ButtonLink>}
        />
        <div className="mt-14 md:mt-20">
          <SelectedWork />
        </div>
      </section>

      <section id="services" className="bg-surface" aria-labelledby="services-title">
        <div className="container-page section-y">
          <SectionHeading
            id="services-title"
            eyebrow={m.home.services.eyebrow}
            title={m.home.services.title}
            action={<ButtonLink href="/services" variant="secondary" arrow>{m.home.services.cta}</ButtonLink>}
          />
          <div className="mt-14 md:mt-20">
            <ServicesList m={m} />
          </div>
        </div>
      </section>

      <section className="container-page section-y" aria-labelledby="why-title">
        <div className="grid gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow mb-6">{m.home.why.eyebrow}</p>
            <h2 id="why-title" className="text-headline font-medium text-balance">{m.home.why.title}</h2>
            <p className="mt-6 max-w-md text-lede text-muted">{m.home.why.lede}</p>
          </Reveal>
          <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 md:col-span-7">
            {m.home.why.items.map(({ t, d }, i) => (
              <li key={t} className="bg-canvas">
                <Reveal delay={i * 0.06} className="h-full p-8 md:p-10">
                  <h3 className="text-[1.25rem] font-medium tracking-[-0.025em]">{t}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{d}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="container-page section-y pt-0" aria-labelledby="pricing-title">
        <SectionHeading
          id="pricing-title"
          eyebrow={m.home.pricing.eyebrow}
          title={m.home.pricing.title}
          description={m.home.pricing.description}
          action={<ButtonLink href="/pricing#compare" variant="secondary" arrow>{m.common.comparePackages}</ButtonLink>}
        />
        <div className="mt-14 md:mt-20">
          <PricingCards locale={locale} m={m} />
        </div>
        <p className="mt-8 text-center text-sm text-muted">{m.home.pricing.custom}</p>
      </section>

      <section id="process" className="bg-canvas-deep" aria-labelledby="process-title">
        <div className="container-page section-y">
          <SectionHeading
            id="process-title"
            eyebrow={m.home.process.eyebrow}
            title={m.home.process.title}
            action={<ButtonLink href="/process" variant="secondary" arrow>{m.home.process.cta}</ButtonLink>}
          />
          <div className="mt-14 md:mt-20">
            <ProcessSteps m={m} />
          </div>
        </div>
      </section>

      <section className="container-page section-y" aria-labelledby="faq-title">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-6">{m.home.faq.eyebrow}</p>
            <h2 id="faq-title" className="text-headline font-medium">{m.home.faq.title}</h2>
          </div>
          <div className="md:col-span-8">
            <FaqList m={m} />
          </div>
        </div>
      </section>

      <CtaBand locale={locale} m={m} />
    </>
  );
}
