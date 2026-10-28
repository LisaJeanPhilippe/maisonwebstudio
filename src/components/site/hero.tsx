"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { BrowserFrame, PhoneFrame } from "@/components/mockups/frames";
import { AureliaDemo } from "@/components/demos/aurelia";
import { MaisonNoirDemo } from "@/components/demos/maison-noir";
import { SolaceDemo } from "@/components/demos/solace";
import { ArrowRight } from "@/components/ui/icons";
import { LocaleLink, useI18n } from "@/i18n/client";

export function Hero() {
  const { m } = useI18n();
  const words = m.hero.headline.split(" ");
  const stage = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: stage, offset: ["start end", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const yPhone = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [80, -80]);
  const scale = useTransform(scrollYProgress, [0, 0.5], reduce ? [1, 1] : [0.96, 1]);

  return (
    <section className="relative overflow-hidden">
      <div className="container-page pb-16 pt-14 md:pb-24 md:pt-24">
        <p className="enter eyebrow mb-8 flex items-center gap-3" style={{ "--enter-y": "8px" } as CSSProperties}>
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          {m.hero.eyebrow}
        </p>

        <h1 className="max-w-[13ch] text-display font-medium text-balance">
          {words.map((word, i) => (
            <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span className="rise inline-block" style={{ "--enter-delay": `${0.08 + i * 0.06}s` } as CSSProperties}>
                {word}
                {i < words.length - 1 && " "}
              </span>
            </span>
          ))}
        </h1>

        <div className="enter mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end" style={{ "--enter-delay": "0.3s" } as CSSProperties}>
          <p className="text-lede text-muted text-pretty md:col-span-6 lg:col-span-5">
            {m.hero.lede}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-6 md:justify-end lg:col-span-7">
            <LocaleLink href="/start" className="btn btn-primary group h-13 px-7">
              {m.common.startYourWebsite}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </LocaleLink>
            <LocaleLink href="/work" className="btn btn-secondary h-13 px-7">
              {m.common.viewOurWork}
            </LocaleLink>
          </div>
        </div>
      </div>

      {/* Showcase */}
      <div ref={stage} className="enter container-page" style={{ "--enter-y": "40px", "--enter-delay": "0.45s" } as CSSProperties}>
        <div
          role="img"
          aria-label={m.hero.showcaseLabel}
          className="relative overflow-hidden rounded-[var(--radius-media)] bg-canvas-deep px-4 pb-10 pt-10 sm:px-10 md:px-16 md:pb-0 md:pt-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_255_255/0.7),transparent_70%)]"
          />
          <motion.div style={{ y: yBack }} className="absolute start-[-6%] top-[22%] hidden w-[34%] opacity-90 lg:block">
            <BrowserFrame url="maisonnoir.nyc" tone="dark" eager>
              <MaisonNoirDemo />
            </BrowserFrame>
          </motion.div>

          <motion.div style={{ scale }} className="relative mx-auto w-full max-w-[920px] origin-bottom">
            <BrowserFrame url="aureliaskin.com" className="md:rounded-b-none md:border-b-0" eager>
              <AureliaDemo />
            </BrowserFrame>
          </motion.div>

          <motion.div
            style={{ y: yPhone }}
            className="absolute bottom-6 end-4 w-[30%] max-w-[230px] sm:end-8 md:bottom-auto md:end-[4%] md:top-[30%] md:w-[19%]"
          >
            <PhoneFrame screenBg="#eef0ea" eager>
              <SolaceDemo />
            </PhoneFrame>
          </motion.div>
        </div>
      </div>

      <div className="container-page">
        <ul className="grid grid-cols-1 gap-px border-b border-line py-8 text-sm sm:grid-cols-3 md:py-10">
          {m.hero.trust.map(({ k, v }) => (
            <li key={k} className="flex items-baseline gap-3 py-2 sm:justify-center">
              <span className="font-medium">{k}</span>
              <span className="text-muted">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
