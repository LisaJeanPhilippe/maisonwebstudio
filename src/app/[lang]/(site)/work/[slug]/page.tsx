import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/components/demos";
import { BrowserFrame, PhoneFrame } from "@/components/mockups/frames";
import { CtaBand } from "@/components/site/cta-band";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { PROJECTS, getProject } from "@/lib/projects";
import { LOCALES, localizePath, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PROJECTS.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/work/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const project = getProject(slug);
  if (!project) return {};
  const m = await getMessages(locale);
  const copy = m.projects[project.slug];
  return pageMetadata({
    locale,
    path: `/work/${project.slug}`,
    title: fmt(m.meta.project.title, { name: project.name, industry: copy.industry }),
    description: copy.summary,
  });
}

export default async function ProjectPage({ params }: PageProps<"/[lang]/work/[slug]">) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const project = getProject(slug);
  if (!project) notFound();
  const m = await getMessages(locale);
  const copy = m.projects[project.slug];
  const pkg = m.packages[project.package];
  const Demo = DEMOS[project.slug];
  const index = PROJECTS.findIndex((p) => p.slug === project.slug);
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const href = (path: string) => localizePath(locale, path);

  return (
    <>
      <section className="container-page pb-12 pt-10 md:pb-16 md:pt-16">
        <Link href={href("/work")} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft /> {m.common.allWork}
        </Link>
        <Reveal className="mt-10 grid gap-10 md:mt-14 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow mb-6">{fmt(m.caseStudy.eyebrow, { industry: copy.industry })}</p>
            <h1 className="text-display font-medium">{project.name}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:justify-end">
            <Link href={href(`/demo/${project.slug}`)} className="btn btn-primary group">
              {m.common.openLiveDemo}
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container-page">
        <Reveal>
          <div
            role="img"
            aria-label={fmt(m.caseStudy.previewLabel, { name: project.name })}
            className="relative overflow-hidden rounded-[var(--radius-media)] px-[5%] pt-[5%]"
            style={{ background: project.surface }}
          >
            <BrowserFrame
              url={project.domain}
              tone={project.ink === "light" ? "dark" : "light"}
              aspect="aspect-[16/9]"
              className="rounded-b-none border-b-0"
              eager
            >
              <Demo />
            </BrowserFrame>
          </div>
        </Reveal>
      </section>

      <section className="container-page section-y">
        <div className="grid gap-14 md:grid-cols-12">
          <dl className="grid grid-cols-2 gap-6 text-[14px] md:col-span-4 md:grid-cols-1 md:content-start">
            {[
              [m.caseStudy.industry, copy.industry],
              [m.caseStudy.package, pkg.name],
              [m.caseStudy.typefaces, project.typefaces],
              [m.caseStudy.scope, copy.features.join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-line pt-4">
                <dt className="text-muted">{k}</dt>
                <dd className="mt-1.5 text-ink">{v}</dd>
              </div>
            ))}
            <div className="border-t border-line pt-4">
              <dt className="text-muted">{m.caseStudy.palette}</dt>
              <dd className="mt-3 flex gap-2">
                {project.palette.map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: c }}>
                    <span className="sr-only">{c}</span>
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <div className="md:col-span-7 md:col-start-6">
            <Reveal>
              <p className="text-[clamp(1.5rem,1.2rem+1.1vw,2.125rem)] leading-[1.3] tracking-[-0.025em] text-balance">
                {copy.description}
              </p>
            </Reveal>
            <div className="mt-14 grid gap-10 sm:grid-cols-2">
              <Reveal>
                <h2 className="eyebrow mb-4">{m.caseStudy.brief}</h2>
                <p className="text-[16px] leading-relaxed text-muted">{copy.challenge}</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="eyebrow mb-4">{m.caseStudy.approach}</h2>
                <p className="text-[16px] leading-relaxed text-muted">{copy.approach}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="grid gap-4 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div
              role="img"
              aria-label={fmt(m.caseStudy.phonePreviewLabel, { name: project.name })}
              className="flex h-full items-end justify-center gap-6 overflow-hidden rounded-[var(--radius-media)] px-6 pt-12 md:gap-10 md:px-12 md:pt-16"
              style={{ background: project.surface }}
            >
              <PhoneFrame screenBg={project.screen} className="w-[42%] max-w-[260px] translate-y-[8%]">
                <Demo />
              </PhoneFrame>
              <PhoneFrame screenBg={project.screen} className="w-[42%] max-w-[260px] translate-y-[22%]">
                <div style={{ marginTop: -600 }}>
                  <Demo />
                </div>
              </PhoneFrame>
            </div>
          </Reveal>
          <ul className="grid gap-4 md:col-span-5">
            {copy.highlights.map((r, i) => (
              <li key={r.label}>
                <Reveal delay={i * 0.06} className="flex h-full flex-col justify-between rounded-[var(--radius-lg)] border border-line bg-surface p-8">
                  <p className="text-[2.75rem] font-medium leading-none tracking-[-0.05em]">{r.value}</p>
                  <p className="mt-6 text-[14px] text-muted">{r.label}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-page section-y">
        <Link href={href(`/work/${next.slug}`)} className="group block border-t border-line pt-10">
          <p className="eyebrow mb-4">{m.caseStudy.next}</p>
          <div className="flex items-center justify-between gap-6">
            <p className="text-headline font-medium transition-transform duration-500 ease-out-soft group-hover:translate-x-2 rtl:group-hover:-translate-x-2">
              {next.name}
            </p>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-canvas md:h-20 md:w-20">
              <ArrowRight size={20} />
            </span>
          </div>
          <p className="mt-3 text-muted">{m.projects[next.slug].industry}</p>
        </Link>
      </section>

      <CtaBand
        locale={locale}
        m={m}
        title={fmt(m.caseStudy.ctaTitle, { name: project.name })}
        description={fmt(m.caseStudy.ctaBody, { package: pkg.name })}
      />
    </>
  );
}
