import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/components/demos";
import { BrowserFrame, PhoneFrame } from "@/components/mockups/frames";
import { CtaBand } from "@/components/site/cta-band";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { getPackage } from "@/lib/catalog";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  if (!project) return {};
  return { title: `${project.name} — ${project.industry}`, description: project.summary };
}

export default async function ProjectPage({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const Demo = DEMOS[project.slug];
  const pkg = getPackage(project.package)!;
  const index = PROJECTS.findIndex((p) => p.slug === project.slug);
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  return (
    <>
      <section className="container-page pb-12 pt-10 md:pb-16 md:pt-16">
        <Link href="/work" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
          <ArrowLeft /> All work
        </Link>
        <Reveal className="mt-12 grid gap-10 md:mt-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow mb-6">
              {project.industry} · Sample project
            </p>
            <h1 className="text-display font-medium">{project.name}</h1>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:col-span-4 md:justify-end">
            <Link href={`/demo/${project.slug}`} className="btn btn-primary group">
              Open live demo
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="container-page">
        <Reveal
          className="relative overflow-hidden rounded-[var(--radius-media)] px-[5%] pt-[5%]"
          style={{ background: project.surface }}
        >
          <BrowserFrame
            url={project.domain}
            tone={project.ink === "light" ? "dark" : "light"}
            aspect="aspect-[16/9]"
            className="rounded-b-none border-b-0"
          >
            <Demo />
          </BrowserFrame>
        </Reveal>
      </section>

      <section className="container-page section-y">
        <div className="grid gap-14 md:grid-cols-12">
          <dl className="grid grid-cols-2 gap-6 text-[14px] md:col-span-4 md:grid-cols-1 md:content-start">
            {[
              ["Industry", project.industry],
              ["Package", `${pkg.name}`],
              ["Typefaces", project.typefaces],
              ["Scope", project.features.join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="border-t border-line pt-4">
                <dt className="text-muted">{k}</dt>
                <dd className="mt-1.5 text-ink">{v}</dd>
              </div>
            ))}
            <div className="border-t border-line pt-4">
              <dt className="text-muted">Palette</dt>
              <dd className="mt-3 flex gap-2">
                {project.palette.map((c) => (
                  <span key={c} className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: c }} title={c} />
                ))}
              </dd>
            </div>
          </dl>

          <div className="md:col-span-7 md:col-start-6">
            <Reveal>
              <p className="text-[clamp(1.5rem,1.2rem+1.1vw,2.125rem)] leading-[1.3] tracking-[-0.025em] text-balance">
                {project.description}
              </p>
            </Reveal>
            <div className="mt-14 grid gap-10 sm:grid-cols-2">
              <Reveal>
                <h2 className="eyebrow mb-4">The brief</h2>
                <p className="text-[16px] leading-relaxed text-muted">{project.challenge}</p>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="eyebrow mb-4">Our approach</h2>
                <p className="text-[16px] leading-relaxed text-muted">{project.approach}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page">
        <div className="grid gap-4 md:grid-cols-12">
          <Reveal
            className="flex items-end justify-center gap-6 overflow-hidden rounded-[var(--radius-media)] px-6 pt-12 md:col-span-7 md:gap-10 md:px-12 md:pt-16"
            style={{ background: project.surface }}
          >
            <PhoneFrame screenBg={project.screen} className="w-[42%] max-w-[260px] translate-y-[8%]">
              <Demo />
            </PhoneFrame>
            <PhoneFrame screenBg={project.screen} className="w-[42%] max-w-[260px] translate-y-[22%]">
              <div className="-mt-[600px]">
                <Demo />
              </div>
            </PhoneFrame>
          </Reveal>
          <div className="grid gap-4 md:col-span-5">
            {project.highlights.map((r, i) => (
              <Reveal
                key={r.label}
                delay={i * 0.06}
                className="flex flex-col justify-between rounded-[var(--radius-lg)] border border-line bg-surface p-8"
              >
                <p className="text-[2.75rem] font-medium leading-none tracking-[-0.05em]">{r.value}</p>
                <p className="mt-6 text-[14px] text-muted">{r.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-y">
        <Link href={`/work/${next.slug}`} className="group block border-t border-line pt-10">
          <p className="eyebrow mb-4">Next project</p>
          <div className="flex items-center justify-between gap-6">
            <p className="text-headline font-medium transition-transform duration-500 ease-out-soft group-hover:translate-x-2">
              {next.name}
            </p>
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line-strong transition-colors duration-300 group-hover:border-ink group-hover:bg-ink group-hover:text-canvas md:h-20 md:w-20">
              <ArrowRight size={20} />
            </span>
          </div>
          <p className="mt-3 text-muted">{next.industry}</p>
        </Link>
      </section>

      <CtaBand title={`Want a site like ${project.name}?`} description={`This project fits our ${pkg.name} package. Configure yours in minutes and we’ll take it from there.`} />
    </>
  );
}
