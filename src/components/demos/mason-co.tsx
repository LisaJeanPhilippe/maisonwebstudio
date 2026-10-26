import { Facade } from "./art";

const practices = [
  ["Business Advisory", "Formation, governance, and growth strategy for owner-led companies."],
  ["Tax & Accounting", "Year-round planning and filing for businesses and families."],
  ["Estate Planning", "Wills, trusts and succession plans that protect what you’ve built."],
] as const;

export function MasonCoDemo() {
  return (
    <div className="@container bg-[#fbfaf7] font-[family-name:var(--font-geist-sans)] text-[#14211c]">
      <header className="flex items-center justify-between border-b border-[#14211c]/10 px-5 py-5 @3xl:px-12">
        <span className="font-[family-name:var(--font-instrument)] text-[26px]">
          Mason <span className="italic text-[#2f4a3f]">&amp;</span> Co.
        </span>
        <nav className="hidden gap-9 text-[14px] text-[#14211c]/70 @3xl:flex">
          <span>Practice areas</span>
          <span>People</span>
          <span>Insights</span>
          <span>Contact</span>
        </nav>
        <span className="bg-[#14211c] px-5 py-3 text-[13px] text-[#fbfaf7]">Book a consultation</span>
      </header>

      <section className="grid @3xl:grid-cols-[1.25fr_1fr]">
        <div className="px-5 py-12 @3xl:border-r @3xl:border-[#14211c]/10 @3xl:px-12 @3xl:py-20">
          <p className="text-[12px] tracking-[0.16em] text-[#2f4a3f] uppercase">Advisors since 1989</p>
          <h1 className="mt-6 font-[family-name:var(--font-instrument)] text-[56px] leading-[0.98] tracking-[-0.01em] @3xl:text-[96px]">
            Counsel for
            <br />
            what comes <em className="text-[#2f4a3f]">next.</em>
          </h1>
          <p className="mt-6 max-w-[440px] text-[16px] leading-relaxed text-[#14211c]/65">
            Mason &amp; Co. helps founders, family businesses and individuals make confident
            financial and legal decisions — with one trusted team.
          </p>
          <div className="mt-10 grid max-w-[520px] grid-cols-3 border-t border-[#14211c]/15 pt-6">
            {[
              ["35+", "Years in practice"],
              ["1,200", "Clients advised"],
              ["98%", "Client retention"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-[family-name:var(--font-instrument)] text-[36px] @3xl:text-[44px]">{n}</p>
                <p className="mt-1 text-[12px] text-[#14211c]/55">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative min-h-[320px]">
          <Facade className="absolute inset-0 h-full w-full" />
          <div className="absolute bottom-5 left-5 right-5 bg-[#fbfaf7]/95 p-5 @3xl:bottom-10 @3xl:left-10 @3xl:right-auto @3xl:w-[300px]">
            <p className="text-[12px] text-[#14211c]/55">Next available</p>
            <p className="mt-1 text-[16px]">Free 30-minute consultation</p>
            <p className="mt-3 text-[13px] text-[#2f4a3f] underline underline-offset-4">Choose a time →</p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#14211c]/10 px-5 py-14 @3xl:px-12 @3xl:py-20">
        <div className="flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-instrument)] text-[40px] leading-none @3xl:text-[56px]">
            How we help
          </h2>
          <span className="hidden text-[14px] text-[#14211c]/60 @3xl:block">All practice areas →</span>
        </div>
        <div className="mt-10 grid gap-px bg-[#14211c]/10 @3xl:grid-cols-3">
          {practices.map(([t, d], i) => (
            <div key={t} className="bg-[#fbfaf7] py-6 @3xl:px-8 @3xl:py-8 @3xl:first:pl-0">
              <span className="text-[12px] text-[#2f4a3f]">0{i + 1}</span>
              <p className="mt-6 font-[family-name:var(--font-instrument)] text-[28px]">{t}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#14211c]/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#14211c] px-5 py-14 text-[#fbfaf7] @3xl:px-12 @3xl:py-20">
        <p className="max-w-[860px] font-[family-name:var(--font-instrument)] text-[30px] leading-[1.15] @3xl:text-[44px]">
          “They treated our family business like their own. Twenty years later, they’re still the
          first call we make.”
        </p>
        <p className="mt-6 text-[13px] text-[#fbfaf7]/60">Elena Ruiz — Owner, Ruiz Building Supply</p>
      </section>
    </div>
  );
}
