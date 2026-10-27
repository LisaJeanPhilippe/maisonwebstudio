import Link from "next/link";
import { PACKAGES } from "@/lib/catalog";
import { Check } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { localizePath, type Locale } from "@/i18n/config";
import { fmt, formatPrice } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";

export function PricingCards({ locale, m }: { locale: Locale; m: Messages }) {
  return (
    <ul className="grid gap-4 lg:grid-cols-3">
      {PACKAGES.map((pkg, i) => {
        const copy = m.packages[pkg.id];
        const featured = Boolean(pkg.featured);
        return (
          <li key={pkg.id}>
            <Reveal delay={i * 0.08} className="h-full">
              <article
                aria-labelledby={`pkg-${pkg.id}`}
                className={`flex h-full flex-col rounded-[var(--radius-lg)] border p-8 md:p-10 ${
                  featured ? "theme-dark border-ink bg-ink text-canvas" : "border-line bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 id={`pkg-${pkg.id}`} className="text-[1.125rem] font-medium tracking-[-0.02em]">
                    {copy.name}
                  </h3>
                  {featured && (
                    <span className="rounded-full border border-canvas/40 px-3 py-1 text-[12px] text-canvas">
                      {m.common.mostChosen}
                    </span>
                  )}
                </div>
                <p className="mt-10 flex flex-wrap items-baseline gap-2">
                  <span className="text-[3.5rem] font-medium leading-none tracking-[-0.05em]">
                    {formatPrice(locale, pkg.price)}
                  </span>
                  <span className={featured ? "text-canvas/80" : "text-muted"}>{m.common.oneTime}</span>
                </p>
                <p className={`mt-5 text-[15px] leading-relaxed ${featured ? "text-canvas/80" : "text-muted"}`}>
                  {copy.tagline}
                </p>
                <p className={`mt-2 text-[13px] ${featured ? "text-canvas/80" : "text-muted"}`}>
                  {fmt(m.pricing.timeline, { timeline: copy.timeline })}
                </p>

                <ul
                  className={`mb-10 mt-8 space-y-3 border-t pt-8 text-[14.5px] ${featured ? "border-canvas/20" : "border-line"}`}
                >
                  {copy.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className={`mt-1 shrink-0 ${featured ? "text-canvas/80" : "text-sage-deep"}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={localizePath(locale, `/start?package=${pkg.id}`)}
                  className={`btn mt-auto w-full ${featured ? "bg-canvas text-ink hover:bg-white" : "btn-secondary"}`}
                >
                  {fmt(m.pricing.choose, { name: copy.short })}
                </Link>
              </article>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
