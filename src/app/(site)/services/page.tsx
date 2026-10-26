import type { Metadata } from "next";
import { ServicesList } from "@/components/site/services-list";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { ADD_ONS, formatPrice } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Services",
  description: "Website design, e-commerce, redesigns, landing pages and website strategy.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">Services</p>
          <h1 className="max-w-[15ch] text-display font-medium text-balance">Design and technology, in balance.</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">
            From a focused three-page site to a full online store, every project gets the same care:
            thoughtful strategy, refined design and a fast, reliable build.
          </p>
        </Reveal>
      </section>

      <section className="container-page pb-[var(--space-section)]">
        <ServicesList detailed />
      </section>

      <section className="bg-surface">
        <div className="container-page section-y">
          <div className="grid gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <p className="eyebrow mb-6">Add-ons</p>
              <h2 className="text-headline font-medium">Tailor any package.</h2>
              <p className="mt-6 text-lede text-muted">Add exactly what you need when you configure your site.</p>
            </Reveal>
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 md:col-span-8">
              {ADD_ONS.map((a) => (
                <li key={a.id} className="flex flex-col bg-surface p-7">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[1.0625rem] font-medium tracking-[-0.02em]">{a.name}</h3>
                    <span className="shrink-0 text-[15px]">
                      {formatPrice(a.price)}
                      {a.kind === "unit" && <span className="text-muted"> / {a.unitLabel}</span>}
                    </span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{a.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
