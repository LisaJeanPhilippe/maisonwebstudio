import { PROCESS } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";

export function ProcessSteps() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-line bg-line md:grid-cols-5">
      {PROCESS.map((step, i) => (
        <li key={step.n} className="bg-canvas">
          <Reveal delay={i * 0.06} className="flex h-full flex-col p-7 md:min-h-[340px] md:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-subtle">{step.n}</span>
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
