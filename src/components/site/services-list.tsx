import { SERVICES } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

export function ServicesList({ detailed = false }: { detailed?: boolean }) {
  return (
    <ol className="border-t border-line">
      {SERVICES.map((s, i) => (
        <li key={s.n} className="border-b border-line">
          <Reveal delay={i * 0.04} className="group grid gap-4 py-10 md:grid-cols-12 md:gap-8 md:py-14">
            <span className="font-mono text-sm text-subtle md:col-span-2 md:pt-3">{s.n}</span>
            <h3 className="text-[clamp(2rem,1.4rem+2.6vw,3.75rem)] font-medium leading-none tracking-[-0.045em] transition-transform duration-500 ease-out-soft md:col-span-5 md:group-hover:translate-x-2">
              {s.title}
            </h3>
            <div className="md:col-span-5 md:pt-2">
              <p className="max-w-md text-[16px] leading-relaxed text-muted">{s.description}</p>
              {detailed && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft ring-1 ring-line">
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
