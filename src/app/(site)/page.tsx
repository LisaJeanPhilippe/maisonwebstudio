import Link from "next/link";
import { Hero } from "@/components/site/hero";
import { SelectedWork } from "@/components/site/selected-work";
import { ServicesList } from "@/components/site/services-list";
import { ProcessSteps } from "@/components/site/process-steps";
import { PricingCards } from "@/components/site/pricing-cards";
import { FaqList } from "@/components/site/faq";
import { CtaBand } from "@/components/site/cta-band";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";

const INDUSTRIES = [
  "Skincare brands",
  "Restaurants",
  "Interior designers",
  "Wellness studios",
  "Law & accounting firms",
  "Boutiques",
  "Salons & spas",
  "Consultants",
  "Real estate",
  "Cafés",
];

const PRINCIPLES = [
  ["Fixed, transparent pricing", "Know exactly what you’re paying before you start. No hourly billing, no surprise invoices."],
  ["Designed, not templated", "Every site is designed for your business — typography, layout and details included."],
  ["Built to convert", "Clear calls to action, fast pages and SEO foundations that help customers find and choose you."],
  ["One accountable team", "Strategy, design and development under one roof, with a single point of contact."],
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section aria-label="Industries we work with" className="overflow-hidden border-b border-line py-6">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap text-[15px] text-muted">
          {[...INDUSTRIES, ...INDUSTRIES].map((name, i) => (
            <span key={i} className="flex items-center gap-12">
              {name}
              <span className="h-1 w-1 rounded-full bg-line-strong" aria-hidden />
            </span>
          ))}
        </div>
      </section>

      <section id="work" className="container-page section-y">
        <SectionHeading
          eyebrow="Selected Work"
          title="Sites with a point of view."
          description="A selection of sample websites across beauty, hospitality, wellness and professional services — each designed from a blank page."
          action={<ButtonLink href="/work" variant="secondary" arrow>All work</ButtonLink>}
        />
        <div className="mt-14 md:mt-20">
          <SelectedWork />
        </div>
      </section>

      <section id="services" className="bg-surface">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow="Services"
            title="Everything your website needs. Nothing it doesn’t."
            action={<ButtonLink href="/services" variant="secondary" arrow>Our services</ButtonLink>}
          />
          <div className="mt-14 md:mt-20">
            <ServicesList />
          </div>
        </div>
      </section>

      <section className="container-page section-y">
        <div className="grid gap-16 md:grid-cols-12">
          <Reveal className="md:col-span-5">
            <p className="eyebrow mb-6">Why Masion</p>
            <h2 className="text-headline font-medium text-balance">
              Professional websites without the agency headache.
            </h2>
            <p className="mt-6 max-w-md text-lede text-muted">
              The craft of a design studio with the clarity of a product you can buy online.
            </p>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line sm:grid-cols-2 md:col-span-7">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.06} className="bg-canvas p-8 md:p-10">
                <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                <h3 className="mt-8 text-[1.25rem] font-medium tracking-[-0.025em]">{t}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="container-page section-y pt-0">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple packages. Clear outcomes."
          description="One-time pricing with everything you need to launch, paid in full at checkout."
          action={<ButtonLink href="/pricing#compare" variant="secondary" arrow>Compare packages</ButtonLink>}
        />
        <div className="mt-14 md:mt-20">
          <PricingCards />
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          Need something custom?{" "}
          <Link href="/start" className="text-ink underline underline-offset-4">
            Configure add-ons
          </Link>{" "}
          like copywriting, an online store or rush delivery.
        </p>
      </section>

      <section id="process" className="bg-canvas-deep">
        <div className="container-page section-y">
          <SectionHeading
            eyebrow="Process"
            title="From first click to launch, in five clear steps."
            action={<ButtonLink href="/process" variant="secondary" arrow>How it works</ButtonLink>}
          />
          <div className="mt-14 md:mt-20">
            <ProcessSteps />
          </div>
        </div>
      </section>

      <section className="container-page section-y">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="eyebrow mb-6">Questions</p>
            <h2 className="text-headline font-medium">Good to know.</h2>
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
