"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CATEGORIES, PROJECTS, type Category, type Project } from "@/lib/projects";
import { ArrowUpRight } from "@/components/ui/icons";
import { LocaleLink, useI18n } from "@/i18n/client";
import { fmt, plur } from "@/i18n/format";
import { ProjectMedia } from "./project-media";

type Row =
  | { kind: "feature"; project: Project }
  | { kind: "pair"; projects: [Project, Project] }
  | { kind: "split"; project: Project; flip: boolean };

/** Alternate layouts so no two neighbouring projects are presented the same way. */
function toRows(projects: Project[]): Row[] {
  const rows: Row[] = [];
  let i = 0;
  let step = 0;
  while (i < projects.length) {
    const pattern = step % 3;
    if (pattern === 0) {
      rows.push({ kind: "feature", project: projects[i] });
      i += 1;
    } else if (pattern === 1 && i + 1 < projects.length) {
      rows.push({ kind: "pair", projects: [projects[i], projects[i + 1]] });
      i += 2;
    } else {
      rows.push({ kind: "split", project: projects[i], flip: step % 2 === 0 });
      i += 1;
    }
    step += 1;
  }
  return rows;
}

function ViewProject() {
  const { m } = useI18n();
  return (
    <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium">
      {m.common.viewProject}
      <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5" />
    </span>
  );
}

function Meta({ project, large = false }: { project: Project; large?: boolean }) {
  const { m } = useI18n();
  const copy = m.projects[project.slug];
  return (
    <div className="mt-6 flex flex-col gap-4 md:mt-7 md:flex-row md:items-start md:justify-between md:gap-10">
      <div>
        <p className="eyebrow mb-3">{copy.industry}</p>
        <h3 className={`${large ? "text-title" : "text-[1.5rem] leading-tight tracking-[-0.03em]"} font-medium`}>
          {project.name}
        </h3>
      </div>
      <div className={large ? "md:max-w-md" : "md:max-w-xs"}>
        <p className="text-[15px] leading-relaxed text-muted">{copy.summary}</p>
        <ViewProject />
      </div>
    </div>
  );
}

export function SelectedWork({ showFilters = true }: { showFilters?: boolean }) {
  const { locale, m } = useI18n();
  const [active, setActive] = useState<Category>("All");
  const filtered = useMemo(
    () => (active === "All" ? PROJECTS : PROJECTS.filter((p) => p.categories.includes(active))),
    [active],
  );
  const rows = useMemo(() => toRows(filtered), [filtered]);
  const label = (p: Project) => fmt(m.caseStudy.previewLabel, { name: p.name });

  return (
    <div>
      {showFilters && (
        <>
          <div
            role="group"
            aria-label={m.work.filterLabel}
            className="no-scrollbar -mx-[var(--space-gutter)] mb-4 flex gap-2 overflow-x-auto px-[var(--space-gutter)] py-1"
          >
            {CATEGORIES.map((c) => {
              const count = c === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.categories.includes(c)).length;
              const isActive = c === active;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(c)}
                  className={`relative min-h-11 shrink-0 rounded-full border px-4 text-[14px] transition-colors duration-300 ${
                    isActive ? "border-ink text-canvas" : "border-line-strong text-ink-soft hover:border-ink"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="work-filter"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", stiffness: 400, damping: 36 }}
                    />
                  )}
                  <span className="relative">
                    {m.work.categories[c]}{" "}
                    <span className={isActive ? "text-canvas/75" : "text-muted"}>{count}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <p className="sr-only" role="status">
            {plur(locale, m.work.showing, filtered.length)}
          </p>
          <div className="mb-8 md:mb-12" />
        </>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-20 md:gap-32"
        >
          {rows.map((row, i) => {
            if (row.kind === "feature") {
              return (
                <LocaleLink key={row.project.slug} href={`/work/${row.project.slug}`} className="group block">
                  <ProjectMedia project={row.project} label={label(row.project)} variant="wide" />
                  <Meta project={row.project} large />
                </LocaleLink>
              );
            }
            if (row.kind === "pair") {
              return (
                <div key={`pair-${i}`} className="grid gap-20 md:grid-cols-12 md:gap-8">
                  <LocaleLink href={`/work/${row.projects[0].slug}`} className="group block md:col-span-7">
                    <ProjectMedia project={row.projects[0]} label={label(row.projects[0])} variant="tall" />
                    <Meta project={row.projects[0]} />
                  </LocaleLink>
                  <LocaleLink href={`/work/${row.projects[1].slug}`} className="group block md:col-span-5 md:mt-40">
                    <ProjectMedia project={row.projects[1]} label={label(row.projects[1])} variant="phones" />
                    <Meta project={row.projects[1]} />
                  </LocaleLink>
                </div>
              );
            }
            const p = row.project;
            const copy = m.projects[p.slug];
            return (
              <LocaleLink
                key={p.slug}
                href={`/work/${p.slug}`}
                className="group grid gap-8 md:grid-cols-12 md:items-center md:gap-12"
              >
                <div className={`md:col-span-8 ${row.flip ? "md:order-2" : ""}`}>
                  <ProjectMedia project={p} label={label(p)} variant="tall" />
                </div>
                <div className={`md:col-span-4 ${row.flip ? "md:order-1" : ""}`}>
                  <p className="eyebrow mb-4">{copy.industry}</p>
                  <h3 className="text-title font-medium">{p.name}</h3>
                  <p className="mt-5 text-[15px] leading-relaxed text-muted">{copy.description}</p>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {copy.features.slice(0, 4).map((f) => (
                      <li key={f} className="rounded-full border border-line-strong px-3 py-1 text-[13px] text-ink-soft">
                        {f}
                      </li>
                    ))}
                  </ul>
                  <ViewProject />
                </div>
              </LocaleLink>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
