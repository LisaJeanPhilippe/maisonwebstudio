import type { Metadata } from "next";
import Link from "next/link";
import { COMPARISON, PACKAGES, formatPrice } from "@/lib/catalog";
import { PricingCards } from "@/components/site/pricing-cards";
import { FaqList } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { Check, Minus } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Website packages from $499. Compare Starter, Business and Premium websites.",
};

export default function PricingPage() {
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-20 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">Pricing</p>
          <h1 className="max-w-[13ch] text-display font-medium text-balance">Premium design, honest pricing.</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">
            Three packages, one-time pricing. Pay in full or start with a 50% deposit — the balance is
            due when your site is ready to launch.
          </p>
        </Reveal>
      </section>

      <section className="container-page">
        <PricingCards />
      </section>

      <section id="compare" className="container-page section-y">
        <Reveal>
          <p className="eyebrow mb-6">Compare</p>
          <h2 className="text-headline font-medium">Compare packages.</h2>
        </Reveal>
        <div className="-mx-[var(--space-gutter)] mt-12 overflow-x-auto px-[var(--space-gutter)]">
          <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
            <caption className="sr-only">Package comparison</caption>
            <thead>
              <tr className="border-b border-ink">
                <th scope="col" className="w-[34%] py-5 font-normal text-muted">Feature</th>
                {PACKAGES.map((p) => (
                  <th key={p.id} scope="col" className="py-5 pr-4 align-bottom font-medium">
                    <span className="block">{p.name.replace(" Website", "")}</span>
                    <span className="mt-1 block text-[1.75rem] tracking-[-0.04em]">{formatPrice(p.price)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.label} className="border-b border-line">
                  <th scope="row" className="py-4 pr-4 font-normal text-ink-soft">{row.label}</th>
                  {PACKAGES.map((p) => {
                    const v = row.values[p.id];
                    return (
                      <td key={p.id} className="py-4 pr-4">
                        {v === true ? (
                          <Check size={18} className="text-sage-deep" aria-label="Included" />
                        ) : v === false ? (
                          <Minus size={18} className="text-line-strong" aria-label="Not included" />
                        ) : (
                          v
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td />
                {PACKAGES.map((p) => (
                  <td key={p.id} className="pt-8 pr-4">
                    <Link href={`/start?package=${p.id}`} className={`btn btn-sm ${p.highlight ? "btn-primary" : "btn-secondary"}`}>
                      Choose
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="faq" className="bg-surface">
        <div className="container-page section-y grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-6">FAQ</p>
            <h2 className="text-headline font-medium">Questions, answered.</h2>
          </div>
          <div className="md:col-span-8">
            <FaqList />
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
