import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISON, PACKAGES } from "@/lib/catalog";
import { PricingCards } from "@/components/site/pricing-cards";
import { FaqList } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { Check, Minus } from "@/components/ui/icons";
import { localizePath, type Locale } from "@/i18n/config";
import { formatPrice } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/pricing", title: m.meta.pricing.title, description: m.meta.pricing.description });
}

export default async function PricingPage({ params }: PageProps<"/[lang]/pricing">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  const [before, after] = m.pricing.paymentNote.split("{link}");

  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-20 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">{m.pricing.eyebrow}</p>
          <h1 className="max-w-[13ch] text-display font-medium text-balance">{m.pricing.title}</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">{m.pricing.lede}</p>
        </Reveal>
      </section>

      <section className="container-page" aria-label={m.pricing.eyebrow}>
        <PricingCards locale={locale} m={m} headingLevel={2} />
        <p className="mt-8 text-center text-sm text-muted">
          {before}
          <Link href={localizePath(locale, "/payment-agreement")} className="text-ink underline underline-offset-4">
            {m.pricing.paymentLink}
          </Link>
          {after}
        </p>
      </section>

      <section id="compare" className="container-page section-y" aria-labelledby="compare-title">
        <Reveal>
          <p className="eyebrow mb-6">{m.pricing.compareEyebrow}</p>
          <h2 id="compare-title" className="text-headline font-medium">{m.pricing.compareTitle}</h2>
        </Reveal>
        <div className="relative -mx-[var(--space-gutter)] mt-12 overflow-x-auto px-[var(--space-gutter)]" tabIndex={0} role="region" aria-labelledby="compare-title">
          <table className="w-full min-w-[640px] border-collapse text-start text-[15px]">
            <caption className="sr-only">{m.pricing.compareCaption}</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="w-[34%] py-5 text-start font-normal text-muted">{m.pricing.feature}</th>
                {PACKAGES.map((p) => (
                  <th key={p.id} scope="col" className="py-5 pe-4 text-start align-bottom font-medium">
                    <span className="block">{m.packages[p.id].short}</span>
                    <span className="mt-1 block text-[1.75rem] tracking-[-0.04em]">{formatPrice(locale, p.price)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.key} className="border-b border-line">
                  <th scope="row" className="py-4 pe-4 text-start font-normal text-ink-soft">
                    {m.compare.labels[row.key as keyof typeof m.compare.labels]}
                  </th>
                  {PACKAGES.map((p) => {
                    const v = row.values[p.id];
                    return (
                      <td key={p.id} className="py-4 pe-4">
                        {v === true ? (
                          <>
                            <Check size={18} className="text-sage-deep" />
                            <span className="sr-only">{m.pricing.included}</span>
                          </>
                        ) : v === false ? (
                          <>
                            <Minus size={18} className="text-muted" />
                            <span className="sr-only">{m.pricing.notIncluded}</span>
                          </>
                        ) : v === "timeline" ? (
                          m.packages[p.id].timeline
                        ) : (
                          m.compare.values[v]
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td />
                {PACKAGES.map((p) => (
                  <td key={p.id} className="pe-4 pt-8">
                    <Link
                      href={localizePath(locale, `/start?package=${p.id}`)}
                      className={`btn btn-sm ${p.featured ? "btn-primary" : "btn-secondary"}`}
                      aria-label={`${m.pricing.chooseShort} ${m.packages[p.id].name}`}
                    >
                      {m.pricing.chooseShort}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className="bg-surface" aria-labelledby="faq-title">
        <div className="container-page section-y grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-6">{m.pricing.faqEyebrow}</p>
            <h2 id="faq-title" className="text-headline font-medium">{m.pricing.faqTitle}</h2>
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
