import type { Metadata } from "next";
import { PROCESS } from "@/lib/content";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Process",
  description: "How Masion Web Studio takes your website from order to launch.",
};

export default function ProcessPage() {
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">Process</p>
          <h1 className="max-w-[14ch] text-display font-medium text-balance">Calm, clear and on schedule.</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">
            No endless meetings or vague timelines. A simple process with defined steps, shared
            progress and a launch date you can plan around.
          </p>
        </Reveal>
      </section>

      <section className="container-page pb-[var(--space-section)]">
        <ol className="relative">
          {PROCESS.map((step, i) => (
            <li key={step.n} className="border-t border-line">
              <Reveal delay={i * 0.04} className="grid gap-6 py-12 md:grid-cols-12 md:gap-8 md:py-16">
                <span className="text-[clamp(3rem,2rem+4vw,6rem)] font-medium leading-none tracking-[-0.06em] text-ink/15 md:col-span-3">
                  {step.n}
                </span>
                <div className="md:col-span-4">
                  <h2 className="text-title font-medium">{step.title}</h2>
                  <p className="mt-3 font-mono text-xs tracking-[0.1em] text-muted uppercase">{step.duration}</p>
                </div>
                <p className="max-w-lg text-[16.5px] leading-relaxed text-muted md:col-span-5">{step.description}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-surface">
        <div className="container-page section-y grid gap-12 md:grid-cols-3">
          {[
            ["Shared project board", "See every task, file and approval in one place — no digging through email threads."],
            ["Weekly updates", "A short written update every week, so you always know what’s next."],
            ["After launch", "A walkthrough of your site, plus optional care plans for updates and peace of mind."],
          ].map(([t, d], i) => (
            <Reveal key={t} delay={i * 0.06}>
              <h3 className="text-[1.375rem] font-medium tracking-[-0.03em]">{t}</h3>
              <p className="mt-3 text-[15.5px] leading-relaxed text-muted">{d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <CtaBand />
    </>
  );
}
