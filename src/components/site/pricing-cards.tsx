import Link from "next/link";
import { PACKAGES, formatPrice } from "@/lib/catalog";
import { Check } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";

export function PricingCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PACKAGES.map((pkg, i) => {
        const featured = Boolean(pkg.highlight);
        return (
          <Reveal key={pkg.id} delay={i * 0.08} className="h-full">
            <article
              className={`flex h-full flex-col rounded-[var(--radius-lg)] border p-8 md:p-10 ${
                featured ? "border-ink bg-ink text-canvas" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[1.125rem] font-medium tracking-[-0.02em]">{pkg.name}</h3>
                {pkg.highlight && (
                  <span className="rounded-full border border-canvas/25 px-3 py-1 text-[12px] text-canvas/80">
                    {pkg.highlight}
                  </span>
                )}
              </div>
              <p className="mt-10 flex items-baseline gap-2">
                <span className="text-[3.5rem] font-medium leading-none tracking-[-0.05em]">{formatPrice(pkg.price)}</span>
                <span className={featured ? "text-canvas/55" : "text-muted"}>one-time</span>
              </p>
              <p className={`mt-5 text-[15px] leading-relaxed ${featured ? "text-canvas/70" : "text-muted"}`}>
                {pkg.tagline}
              </p>
              <p className={`mt-2 text-[13px] ${featured ? "text-canvas/55" : "text-subtle"}`}>
                Typical timeline: {pkg.timeline}
              </p>

              <ul className={`mb-10 mt-8 space-y-3 border-t pt-8 text-[14.5px] ${featured ? "border-canvas/15" : "border-line"}`}>
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`mt-1 shrink-0 ${featured ? "text-canvas/70" : "text-sage"}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={`/start?package=${pkg.id}`}
                className={`btn mt-auto w-full ${featured ? "bg-canvas text-ink hover:bg-white" : "btn-secondary"}`}
              >
                Choose {pkg.name.replace(" Website", "")}
              </Link>
            </article>
          </Reveal>
        );
      })}
    </div>
  );
}
