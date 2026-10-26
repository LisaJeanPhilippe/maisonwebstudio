import { CreamJar, SerumBottle, Tube } from "./art";

const products = [
  { name: "Cloud Barrier Cream", note: "Ceramide moisturizer", price: 58, tint: "#efe2d6", kind: "jar" },
  { name: "Lumière Serum", note: "Vitamin C + niacinamide", price: 64, tint: "#e3b99c", kind: "bottle" },
  { name: "Soft Peptide Balm", note: "Lip & cheek treatment", price: 24, tint: "#e7cfc2", kind: "tube" },
  { name: "Night Veil Oil", note: "Squalane facial oil", price: 72, tint: "#c99a83", kind: "bottle" },
] as const;

export function AureliaDemo() {
  return (
    <div className="@container bg-[#f5eee8] font-[family-name:var(--font-geist-sans)] text-[#3a2e2a]">
      <div className="bg-[#3a2e2a] py-2 text-center text-[11px] tracking-[0.18em] text-[#f5eee8] uppercase">
        Complimentary shipping on orders over $60
      </div>

      <header className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-5 @3xl:px-12">
        <nav className="hidden gap-7 text-[13px] @3xl:flex">
          <span>Shop</span>
          <span>Rituals</span>
          <span>Ingredients</span>
          <span>Journal</span>
        </nav>
        <span className="@3xl:hidden text-[13px]">Menu</span>
        <span className="font-[family-name:var(--font-cormorant)] text-[26px] tracking-[0.32em] @3xl:text-[30px]">
          AURELIA
        </span>
        <div className="flex justify-end gap-6 text-[13px]">
          <span className="hidden @3xl:inline">Search</span>
          <span className="hidden @3xl:inline">Account</span>
          <span>Bag (2)</span>
        </div>
      </header>

      <section className="grid gap-6 px-5 pb-10 @3xl:grid-cols-[1fr_1.15fr] @3xl:items-center @3xl:gap-12 @3xl:px-12 @3xl:pb-16">
        <div className="order-2 @3xl:order-1 @3xl:pl-6">
          <p className="mb-5 text-[11px] tracking-[0.24em] text-[#9b7a68] uppercase">The Glow Ritual — New</p>
          <h1 className="font-[family-name:var(--font-cormorant)] text-[54px] leading-[0.95] tracking-[-0.01em] @3xl:text-[96px]">
            Skin, <em className="text-[#b07c62]">softly</em>
            <br /> restored.
          </h1>
          <p className="mt-6 max-w-[380px] text-[15px] leading-relaxed text-[#6d5d55]">
            Clinically-minded skincare with a gentle touch. Three steps, made with barrier-loving
            ingredients, for skin that feels calm and looks luminous.
          </p>
          <div className="mt-8 flex gap-3">
            <span className="rounded-full bg-[#3a2e2a] px-7 py-3.5 text-[13px] text-[#f5eee8]">Shop the ritual</span>
            <span className="rounded-full border border-[#3a2e2a]/25 px-7 py-3.5 text-[13px]">Take the skin quiz</span>
          </div>
        </div>
        <div className="relative order-1 aspect-[4/3.6] overflow-hidden rounded-[28px] bg-[radial-gradient(120%_90%_at_30%_20%,#fbe9df_0%,#efd3c3_45%,#d9b39f_100%)] @3xl:order-2">
          <div className="absolute inset-x-0 bottom-[14%] h-[22%] bg-[#d8ae96]/50 blur-2xl" />
          <SerumBottle className="absolute bottom-[12%] left-[20%] h-[64%]" tint="#e3b99c" />
          <CreamJar className="absolute bottom-[10%] left-[44%] w-[34%]" />
          <Tube className="absolute bottom-[11%] right-[12%] h-[48%]" />
          <span className="absolute left-6 top-6 rounded-full bg-white/70 px-3 py-1.5 text-[11px] backdrop-blur">
            ★ 4.9 · 2,300 reviews
          </span>
        </div>
      </section>

      <section className="border-t border-[#3a2e2a]/10 px-5 py-12 @3xl:px-12 @3xl:py-16">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-cormorant)] text-[34px] @3xl:text-[44px]">Bestsellers</h2>
          <span className="text-[13px] underline underline-offset-4">Shop all</span>
        </div>
        <div className="grid grid-cols-2 gap-4 @3xl:grid-cols-4 @3xl:gap-6">
          {products.map((p) => (
            <div key={p.name}>
              <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[20px] bg-[#efe5dc]">
                {p.kind === "jar" && <CreamJar className="w-[62%]" tint={p.tint} />}
                {p.kind === "bottle" && <SerumBottle className="h-[66%]" tint={p.tint} />}
                {p.kind === "tube" && <Tube className="h-[66%]" tint={p.tint} />}
                <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-[18px]">
                  +
                </span>
              </div>
              <p className="mt-3 text-[14px] font-medium">{p.name}</p>
              <div className="mt-1 flex justify-between text-[13px] text-[#8a786e]">
                <span>{p.note}</span>
                <span className="text-[#3a2e2a]">${p.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-5 mb-12 grid gap-8 rounded-[28px] bg-[#3a2e2a] p-8 text-[#f5eee8] @3xl:mx-12 @3xl:grid-cols-3 @3xl:p-14">
        <h3 className="font-[family-name:var(--font-cormorant)] text-[36px] leading-none @3xl:text-[48px]">
          Made with <em>intention</em>.
        </h3>
        {[
          ["Barrier-first", "Ceramides, squalane and oat lipids to keep skin calm."],
          ["Clean, clinically tested", "Dermatologist approved. No fragrance, no fillers."],
        ].map(([t, d]) => (
          <div key={t} className="border-t border-white/20 pt-5">
            <p className="text-[15px]">{t}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-white/60">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
