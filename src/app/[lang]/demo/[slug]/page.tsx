import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/components/demos";
import { LogoMark } from "@/components/ui/logo";
import { PROJECTS, getProject } from "@/lib/projects";
import { LOCALES, localizePath, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { getMessages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => PROJECTS.map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/demo/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const m = await getMessages(lang as Locale);
  // Sample sites are demos: keep them out of search results.
  return pageMetadata({ locale: lang as Locale, path: `/demo/${slug}`, title: fmt(m.meta.demo.title, { name: project.name }), noindex: true });
}

export default async function DemoPage({ params }: PageProps<"/[lang]/demo/[slug]">) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const project = getProject(slug);
  if (!project) notFound();
  const m = await getMessages(locale);
  const Demo = DEMOS[project.slug];

  return (
    <div style={{ background: project.screen }} className="min-h-dvh">
      <main lang="en" dir="ltr">
        <Demo />
      </main>
      <nav
        aria-label={m.demo.toolbar}
        className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="theme-dark flex items-center gap-1 rounded-full bg-[#111]/95 p-1.5 ps-3 text-[13px] text-[#f7f6f2] shadow-lift backdrop-blur">
          <LogoMark className="h-5 w-5 text-[#f7f6f2] [&_path]:stroke-[#111]" />
          <span className="hidden px-2 text-[#f7f6f2]/80 sm:inline">{m.demo.notice}</span>
          <Link href={localizePath(locale, `/work/${project.slug}`)} className="inline-flex min-h-10 items-center rounded-full px-3 hover:bg-white/10">
            {m.demo.caseStudy}
          </Link>
          <Link href={localizePath(locale, "/start")} className="inline-flex min-h-10 items-center rounded-full bg-[#f7f6f2] px-3.5 text-[#111]">
            {m.demo.startYours}
          </Link>
        </div>
      </nav>
    </div>
  );
}
