import { ArchRoom } from "./art";

const projects = [
  ["01", "Casa Lumen", "Residential", "Lisbon", "2025"],
  ["02", "Atelier Ondine", "Retail", "Paris", "2025"],
  ["03", "The Quiet House", "Residential", "Ojai", "2024"],
  ["04", "Hotel Arca", "Hospitality", "Mallorca", "2024"],
] as const;

export function FormStudioDemo() {
  return (
    <div className="@container bg-[#e9e4dc] font-[family-name:var(--font-geist-sans)] text-[#1e1d1b]">
      <header className="flex items-center justify-between px-5 py-5 font-[family-name:var(--font-geist-mono)] text-[11px] tracking-[0.08em] uppercase @3xl:px-10">
        <span className="font-[family-name:var(--font-geist-sans)] text-[18px] font-semibold tracking-[-0.04em] normal-case">
          form studio
        </span>
        <nav className="hidden gap-10 @3xl:flex">
          <span>Projects</span>
          <span>Studio</span>
          <span>Journal</span>
          <span>Contact</span>
        </nav>
        <span className="@3xl:hidden">Index</span>
      </header>

      <section className="px-5 pt-8 @3xl:px-10 @3xl:pt-14">
        <div className="grid gap-6 @3xl:grid-cols-12 @3xl:items-end">
          <h1 className="text-[56px] leading-[0.9] font-medium tracking-[-0.06em] @3xl:col-span-8 @3xl:text-[124px]">
            Spaces with
            <br />a sense of <span className="text-[#b4693f]">calm</span>.
          </h1>
          <p className="max-w-[300px] text-[14px] leading-relaxed text-[#1e1d1b]/65 @3xl:col-span-4 @3xl:justify-self-end">
            An interior architecture practice designing homes, hotels and retail spaces shaped by
            light, material and proportion.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-5 pt-10 @3xl:grid-cols-12 @3xl:gap-4 @3xl:px-10 @3xl:pt-14">
        <div className="col-span-2 overflow-hidden rounded-[6px] @3xl:col-span-7">
          <ArchRoom className="aspect-[4/3] h-full w-full @3xl:aspect-auto @3xl:h-[480px]" variant={0} />
        </div>
        <div className="overflow-hidden rounded-[6px] @3xl:col-span-3">
          <ArchRoom className="aspect-[3/4] h-full w-full @3xl:aspect-auto @3xl:h-[480px]" variant={1} wall="#cfc4b4" floor="#a18f77" />
        </div>
        <div className="flex flex-col justify-between rounded-[6px] bg-[#1e1d1b] p-5 text-[#e9e4dc] @3xl:col-span-2">
          <span className="font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.1em] uppercase opacity-60">
            Featured
          </span>
          <div>
            <p className="text-[20px] leading-tight tracking-[-0.03em]">Casa Lumen</p>
            <p className="mt-1 text-[12px] opacity-60">A 1920s townhouse, reimagined.</p>
            <span className="mt-4 inline-block border-b border-[#e9e4dc]/50 pb-0.5 text-[12px]">View project →</span>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 @3xl:px-10 @3xl:py-16">
        <div className="mb-4 flex justify-between font-[family-name:var(--font-geist-mono)] text-[10px] tracking-[0.1em] text-[#1e1d1b]/50 uppercase">
          <span>Selected projects</span>
          <span>(24)</span>
        </div>
        <ul>
          {projects.map(([n, name, type, city, year]) => (
            <li
              key={n}
              className="grid grid-cols-[32px_1fr_auto] items-baseline gap-4 border-t border-[#1e1d1b]/15 py-4 @3xl:grid-cols-[60px_1.4fr_1fr_1fr_80px]"
            >
              <span className="font-[family-name:var(--font-geist-mono)] text-[11px] text-[#1e1d1b]/50">{n}</span>
              <span className="text-[22px] tracking-[-0.03em] @3xl:text-[30px]">{name}</span>
              <span className="hidden text-[13px] text-[#1e1d1b]/60 @3xl:block">{type}</span>
              <span className="hidden text-[13px] text-[#1e1d1b]/60 @3xl:block">{city}</span>
              <span className="text-right font-[family-name:var(--font-geist-mono)] text-[11px]">{year}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3 px-5 pb-12 @3xl:grid-cols-3 @3xl:px-10">
        <div className="col-span-2 overflow-hidden rounded-[6px]">
          <ArchRoom className="aspect-[16/9] w-full" variant={2} wall="#ddd4c6" floor="#b8a993" />
        </div>
        <div className="flex flex-col justify-end rounded-[6px] bg-[#b4693f] p-6 text-[#f3ece2]">
          <p className="text-[26px] leading-tight tracking-[-0.03em]">Begin a project with us.</p>
          <p className="mt-3 text-[13px] opacity-75">Now booking residential commissions for spring.</p>
        </div>
      </section>
    </div>
  );
}
