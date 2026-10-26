import { Glass, Plate } from "./art";

const menu = [
  ["Hand-dived scallop", "brown butter, celeriac, hazelnut", 24],
  ["Beef tartare", "smoked yolk, capers, rye crisp", 21],
  ["Duck à l'orange", "Rohan duck, blood orange, endive", 46],
  ["Halibut", "beurre blanc, leeks, caviar", 52],
  ["Wild mushroom tart", "comté, black truffle", 34],
  ["Dark chocolate soufflé", "crème fraîche ice cream", 16],
] as const;

export function MaisonNoirDemo() {
  return (
    <div className="@container bg-[#12100e] font-[family-name:var(--font-geist-sans)] text-[#ede6da]">
      <header className="relative flex items-center justify-between px-5 py-6 @3xl:px-14">
        <nav className="hidden gap-8 text-[12px] tracking-[0.14em] text-[#ede6da]/70 uppercase @3xl:flex">
          <span>Menu</span>
          <span>Private dining</span>
          <span>Gift cards</span>
        </nav>
        <span className="font-[family-name:var(--font-instrument)] text-[28px] @3xl:absolute @3xl:left-1/2 @3xl:-translate-x-1/2 @3xl:text-[32px]">
          Maison <em>Noir</em>
        </span>
        <span className="rounded-full border border-[#b89a6a] px-5 py-2.5 text-[12px] tracking-[0.12em] text-[#d9c39b] uppercase">
          Reserve
        </span>
      </header>

      <section className="relative overflow-hidden px-5 pb-12 pt-6 @3xl:grid @3xl:grid-cols-2 @3xl:items-center @3xl:px-14 @3xl:pb-20 @3xl:pt-10">
        <div className="relative z-10">
          <p className="text-[12px] tracking-[0.3em] text-[#b89a6a] uppercase">Modern French · West Village</p>
          <h1 className="mt-6 font-[family-name:var(--font-instrument)] text-[64px] leading-[0.92] @3xl:text-[120px]">
            An evening,
            <br />
            <em className="text-[#d9c39b]">slowly.</em>
          </h1>
          <p className="mt-6 max-w-[400px] text-[15px] leading-relaxed text-[#ede6da]/65">
            A seasonal tasting menu and an intimate wine list, served by candlelight in a
            thirty-two seat dining room.
          </p>

          <div className="mt-10 grid max-w-[520px] grid-cols-3 overflow-hidden rounded-[14px] border border-white/12 text-[12px] @3xl:grid-cols-[1fr_1fr_1fr_auto]">
            {[
              ["Date", "Fri, Nov 14"],
              ["Guests", "2 people"],
              ["Time", "8:00 pm"],
            ].map(([k, v]) => (
              <div key={k} className="border-r border-white/12 px-4 py-3.5">
                <p className="text-[10px] tracking-[0.18em] text-[#ede6da]/45 uppercase">{k}</p>
                <p className="mt-1 text-[14px]">{v}</p>
              </div>
            ))}
            <span className="col-span-3 grid place-items-center bg-[#d9c39b] px-6 py-4 text-[12px] font-medium tracking-[0.12em] text-[#12100e] uppercase @3xl:col-span-1">
              Find a table
            </span>
          </div>
        </div>

        <div className="relative mt-10 aspect-square @3xl:mt-0">
          <div className="absolute inset-[6%] rounded-full bg-[#b89a6a]/10 blur-3xl" />
          <Plate className="relative h-full w-full drop-shadow-2xl" />
          <Glass className="absolute -right-2 top-[2%] h-[46%] @3xl:right-[2%]" />
        </div>
      </section>

      <section className="border-t border-white/10 px-5 py-14 @3xl:px-14 @3xl:py-20">
        <div className="grid gap-10 @3xl:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-[12px] tracking-[0.3em] text-[#b89a6a] uppercase">Autumn menu</p>
            <h2 className="mt-4 font-[family-name:var(--font-instrument)] text-[44px] leading-none @3xl:text-[56px]">
              From the <em>kitchen</em>
            </h2>
            <p className="mt-5 text-[14px] text-[#ede6da]/55">Five courses · $145 · Wine pairing $95</p>
          </div>
          <ul className="grid gap-x-12 gap-y-6 @3xl:grid-cols-2">
            {menu.map(([name, desc, price]) => (
              <li key={name}>
                <div className="flex items-baseline gap-3">
                  <span className="font-[family-name:var(--font-instrument)] text-[22px]">{name}</span>
                  <span className="flex-1 border-b border-dotted border-white/20" />
                  <span className="text-[14px] text-[#d9c39b]">{price}</span>
                </div>
                <p className="mt-1 text-[13px] text-[#ede6da]/50">{desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 border-t border-white/10 px-5 py-10 text-[13px] text-[#ede6da]/60 @3xl:grid-cols-3 @3xl:px-14">
        <div>
          <p className="text-[#ede6da]">Hours</p>
          <p className="mt-2">Tue–Sun · 5:30 pm – 11:00 pm</p>
        </div>
        <div>
          <p className="text-[#ede6da]">Address</p>
          <p className="mt-2">41 Perry Street, New York</p>
        </div>
        <div>
          <p className="text-[#ede6da]">Private events</p>
          <p className="mt-2">events@maisonnoir.com</p>
        </div>
      </section>
    </div>
  );
}
