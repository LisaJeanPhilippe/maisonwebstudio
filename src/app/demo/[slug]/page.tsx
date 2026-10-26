import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DEMOS } from "@/components/demos";
import { LogoMark } from "@/components/ui/logo";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/demo/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: `${project.name} — Live demo`, robots: { index: false } } : {};
}

export default async function DemoPage({ params }: PageProps<"/demo/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();
  const Demo = DEMOS[project.slug];

  return (
    <div style={{ background: project.screen }} className="min-h-dvh">
      <Demo />
      <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        <div className="flex items-center gap-1 rounded-full bg-[#111]/90 p-1.5 pl-3 text-[13px] text-[#f7f6f2] shadow-lift backdrop-blur">
          <LogoMark className="h-5 w-5 text-[#f7f6f2] [&_path]:stroke-[#111]" />
          <span className="hidden px-2 text-[#f7f6f2]/70 sm:inline">Sample site by Masion Web Studio</span>
          <Link href={`/work/${project.slug}`} className="rounded-full px-3 py-1.5 hover:bg-white/10">
            Case study
          </Link>
          <Link href="/start" className="rounded-full bg-[#f7f6f2] px-3.5 py-1.5 text-[#111]">
            Start yours
          </Link>
        </div>
      </div>
    </div>
  );
}
