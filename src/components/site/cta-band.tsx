import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";

export function CtaBand({
  title = "Ready for a website that works as hard as you do?",
  description = "Configure your website in about ten minutes. Clear pricing, a real team, and a launch date you can plan around.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="container-page section-y">
      <Reveal className="relative overflow-hidden rounded-[var(--radius-media)] bg-ink px-6 py-20 text-canvas md:px-16 md:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-sage/25 blur-[120px]"
        />
        <div className="relative max-w-3xl">
          <p className="eyebrow mb-6 !text-canvas/50">Start your project</p>
          <h2 className="text-headline font-medium text-balance">{title}</h2>
          <p className="mt-6 max-w-xl text-lede text-canvas/65">{description}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/start" className="btn group h-13 bg-canvas px-7 text-ink hover:bg-white">
              Start Your Website
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/pricing" className="btn h-13 border border-canvas/25 px-7 text-canvas hover:border-canvas">
              Compare packages
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
