import type { Metadata } from "next";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";
import { BrowserFrame } from "@/components/mockups/frames";
import { FormStudioDemo } from "@/components/demos/form-studio";

export const metadata: Metadata = {
  title: "About",
  description: "Masion Web Studio is a design-led web studio for businesses ready to grow.",
};

const VALUES = [
  ["Restraint", "We remove until only what matters is left. Good design is calm, clear and confident."],
  ["Craft", "Typography, spacing and motion are tuned by hand. Details are what make a site feel premium."],
  ["Clarity", "Plain language, fixed prices and honest timelines. You’ll always know where things stand."],
  ["Partnership", "Your business, your goals. We design for your customers, not for awards."],
];

export default function AboutPage() {
  return (
    <>
      <section className="container-page pb-16 pt-16 md:pb-24 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">About</p>
          <h1 className="max-w-[16ch] text-display font-medium text-balance">
            A creative studio that thinks like a technology company.
          </h1>
        </Reveal>
        <div className="mt-14 grid gap-10 md:mt-20 md:grid-cols-12">
          <Reveal className="md:col-span-5 md:col-start-2" delay={0.1}>
            <p className="text-lede text-ink-soft">
              Masion Web Studio was founded on a simple idea: great design shouldn’t require an
              agency retainer, and buying a website shouldn’t feel like a gamble.
            </p>
          </Reveal>
          <Reveal className="space-y-5 text-[16px] leading-relaxed text-muted md:col-span-5" delay={0.15}>
            <p>
              We pair the craft of an editorial design studio with the clarity of a modern product.
              Fixed packages, transparent pricing and a defined process mean you know what you’re
              getting, when you’re getting it, and what it costs — before you begin.
            </p>
            <p>
              We work with founders, restaurants, studios, practices and brands who care how they’re
              seen. Our job is to make your business look as good online as it is in real life, and
              to make it easy for the right customers to say yes.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="container-page">
        <Reveal className="overflow-hidden rounded-[var(--radius-media)] bg-[#ddd6cb] px-[6%] pt-[6%]">
          <BrowserFrame url="formstudio.co" className="rounded-b-none border-b-0" aspect="aspect-[16/8]">
            <FormStudioDemo />
          </BrowserFrame>
        </Reveal>
      </section>

      <section className="container-page section-y">
        <div className="grid gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-4">
            <p className="eyebrow mb-6">What we value</p>
            <h2 className="text-headline font-medium">Quietly exceptional.</h2>
          </Reveal>
          <dl className="grid gap-x-12 gap-y-12 sm:grid-cols-2 md:col-span-8">
            {VALUES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.06} className="border-t border-line pt-6">
                <dt className="text-[1.375rem] font-medium tracking-[-0.03em]">{t}</dt>
                <dd className="mt-3 text-[15.5px] leading-relaxed text-muted">{d}</dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>
      <CtaBand />
    </>
  );
}
