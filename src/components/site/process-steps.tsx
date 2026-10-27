import type { Messages } from "@/i18n/messages";
import { Reveal } from "@/components/ui/reveal";

export function ProcessSteps({ m }: { m: Messages }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line md:grid-cols-5">
      {m.process.steps.map((step, i) => (
        <li key={step.title} className="bg-canvas">
          <Reveal delay={i * 0.06} className="flex h-full flex-col p-7 md:min-h-[340px] md:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm text-muted" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[12px] text-muted">{step.duration}</span>
            </div>
            <h3 className="mt-10 text-[1.375rem] font-medium tracking-[-0.03em] md:mt-28">{step.title}</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{step.description}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
