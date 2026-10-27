import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { localizePath, type Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export function CtaBand({
  locale,
  m,
  title = m.cta.title,
  description = m.cta.description,
}: {
  locale: Locale;
  m: Messages;
  title?: string;
  description?: string;
}) {
  return (
    <section className="container-page section-y" aria-labelledby="cta-title">
      <Reveal className="theme-dark relative overflow-hidden rounded-[var(--radius-media)] bg-ink px-6 py-20 text-canvas md:px-16 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-40 -top-40 h-[520px] w-[520px] rounded-full bg-sage/25 blur-[120px]"
        />
        <div className="relative max-w-3xl">
          <p className="eyebrow mb-6 !text-canvas/80">{m.cta.eyebrow}</p>
          <h2 id="cta-title" className="text-headline font-medium text-balance">
            {title}
          </h2>
          <p className="mt-6 max-w-xl text-lede text-canvas/80">{description}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={localizePath(locale, "/start")} className="btn group h-13 bg-canvas px-7 text-ink hover:bg-white">
              {m.common.startYourWebsite}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </Link>
            <Link
              href={localizePath(locale, "/pricing#compare")}
              className="inline-flex min-h-11 items-center justify-center px-2 text-[15px] text-canvas/90 underline underline-offset-4 hover:text-canvas"
            >
              {m.common.comparePackages}
            </Link>
          </div>
          <p className="mt-5 text-[13px] text-canvas/80">{m.common.startHint}</p>
        </div>
      </Reveal>
    </section>
  );
}
