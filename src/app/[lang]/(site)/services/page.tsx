import type { Metadata } from "next";
import { ServicesList } from "@/components/site/services-list";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { ADD_ONS } from "@/lib/catalog";
import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export async function generateMetadata({ params }: PageProps<"/[lang]/services">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/services", title: m.meta.services.title, description: m.meta.services.description });
}

export default async function ServicesPage({ params }: PageProps<"/[lang]/services">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">{m.services.page.eyebrow}</p>
          <h1 className="max-w-[15ch] text-display font-medium text-balance">{m.services.page.title}</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">{m.services.page.lede}</p>
        </Reveal>
      </section>

      <section className="container-page pb-[var(--space-section)]" aria-label={m.services.page.eyebrow}>
        <ServicesList m={m} detailed />
      </section>

      <section className="bg-surface" aria-labelledby="addons-title">
        <div className="container-page section-y">
          <div className="grid gap-12 md:grid-cols-12">
            <Reveal className="md:col-span-4">
              <p className="eyebrow mb-6">{m.services.addOns.eyebrow}</p>
              <h2 id="addons-title" className="text-headline font-medium">{m.services.addOns.title}</h2>
              <p className="mt-6 text-lede text-muted">{m.services.addOns.lede}</p>
            </Reveal>
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 md:col-span-8">
              {ADD_ONS.map((a) => (
                <li key={a.id} className="flex flex-col bg-surface p-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[1.0625rem] font-medium tracking-[-0.02em]">{m.addOns[a.id].name}</h3>
                    <span className="shrink-0 text-[15px]">
                      {formatPrice(locale, a.price)}
                      {a.kind === "unit" && <span className="text-muted"> {m.services.addOns.perPage}</span>}
                    </span>
                  </div>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{m.addOns[a.id].description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <CtaBand locale={locale} m={m} />
    </>
  );
}
