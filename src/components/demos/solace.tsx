import { Ripples } from "./art";

const classes = [
  ["Mon", "7:00 am", "Slow Flow Yoga", "Maya", "60 min"],
  ["Mon", "6:30 pm", "Breathwork & Sound", "Theo", "45 min"],
  ["Tue", "8:00 am", "Restorative Pilates", "Ines", "50 min"],
  ["Wed", "12:15 pm", "Lunchtime Reset", "Maya", "30 min"],
] as const;

export function SolaceDemo() {
  return (
    <div className="@container bg-[#eef0ea] font-[family-name:var(--font-geist-sans)] text-[#2c3328]">
      <header className="flex items-center justify-between px-5 py-5 @3xl:px-12">
        <span className="font-[family-name:var(--font-fraunces)] text-[26px] font-light italic">solace</span>
        <nav className="hidden items-center gap-1 rounded-full bg-white/60 p-1 text-[13px] @3xl:flex">
          {["Classes", "Therapies", "Memberships", "About"].map((l, i) => (
            <span key={l} className={`rounded-full px-4 py-2 ${i === 0 ? "bg-white shadow-sm" : ""}`}>
              {l}
            </span>
          ))}
        </nav>
        <span className="rounded-full bg-[#2c3328] px-5 py-2.5 text-[13px] text-[#eef0ea]">Book</span>
      </header>

      <section className="px-5 pt-8 text-center @3xl:px-12 @3xl:pt-14">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6e7b63]" /> New studio now open in Austin
        </p>
        <h1 className="mx-auto mt-6 max-w-[900px] font-[family-name:var(--font-fraunces)] text-[52px] leading-[1] font-light tracking-[-0.03em] @3xl:text-[100px]">
          Breathe in.
          <br />
          <em className="text-[#6e7b63]">Begin again.</em>
        </h1>
        <p className="mx-auto mt-6 max-w-[460px] text-[15px] leading-relaxed text-[#2c3328]/65">
          Yoga, breathwork and bodywork in a light-filled space designed for rest. All levels,
          every body.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <span className="rounded-full bg-[#6e7b63] px-7 py-3.5 text-[13px] text-white">Book your first class</span>
          <span className="hidden rounded-full bg-white px-7 py-3.5 text-[13px] @md:inline">View schedule</span>
        </div>
      </section>

      <section className="grid gap-4 px-5 pt-12 @3xl:grid-cols-[1.4fr_1fr] @3xl:px-12">
        <div className="overflow-hidden rounded-[32px]">
          <Ripples className="aspect-[16/10] w-full" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex-1 rounded-[32px] bg-[#6e7b63] p-7 text-[#eef0ea]">
            <p className="text-[12px] tracking-[0.14em] uppercase opacity-70">Intro offer</p>
            <p className="mt-3 font-[family-name:var(--font-fraunces)] text-[34px] leading-tight font-light">
              Two weeks unlimited — $39
            </p>
          </div>
          <div className="flex-1 rounded-[32px] bg-white p-7">
            <p className="text-[12px] tracking-[0.14em] text-[#2c3328]/50 uppercase">Rated by members</p>
            <p className="mt-3 font-[family-name:var(--font-fraunces)] text-[22px] leading-snug font-light">
              “The calmest hour of my week. I leave feeling like myself again.”
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-12 @3xl:px-12 @3xl:py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-fraunces)] text-[32px] font-light @3xl:text-[44px]">This week</h2>
          <div className="flex gap-1 text-[12px]">
            {["All", "Yoga", "Breath", "Pilates"].map((t, i) => (
              <span key={t} className={`rounded-full px-3.5 py-1.5 ${i === 0 ? "bg-[#2c3328] text-white" : "bg-white"}`}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <ul className="space-y-2">
          {classes.map(([day, time, name, teacher, len]) => (
            <li
              key={name}
              className="grid grid-cols-[56px_1fr_auto] items-center gap-4 rounded-[20px] bg-white px-5 py-4 @3xl:grid-cols-[80px_120px_1fr_120px_100px_auto]"
            >
              <span className="text-[13px] text-[#2c3328]/55">{day}</span>
              <span className="hidden text-[14px] @3xl:block">{time}</span>
              <span className="text-[15px]">{name}</span>
              <span className="hidden text-[13px] text-[#2c3328]/55 @3xl:block">with {teacher}</span>
              <span className="hidden text-[13px] text-[#2c3328]/55 @3xl:block">{len}</span>
              <span className="rounded-full border border-[#2c3328]/15 px-4 py-2 text-[12px]">Reserve</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
