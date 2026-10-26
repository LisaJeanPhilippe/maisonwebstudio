import type { ReactNode } from "react";
import { ScaledSite } from "./scaled-site";

/** Minimal browser chrome around a scaled desktop render. */
export function BrowserFrame({
  url,
  children,
  className = "",
  aspect = "aspect-[16/10]",
  tone = "light",
}: {
  url: string;
  children: ReactNode;
  className?: string;
  aspect?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`overflow-hidden rounded-[14px] border shadow-device ${
        dark ? "border-white/10 bg-[#1b1a18]" : "border-black/[0.06] bg-white"
      } ${className}`}
    >
      <div className={`flex h-8 items-center gap-3 px-3.5 md:h-9 ${dark ? "bg-[#1b1a18]" : "bg-[#f3f2ee]"}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-2.5 w-2.5 rounded-full ${dark ? "bg-white/15" : "bg-black/10"}`} />
          ))}
        </div>
        <div
          className={`mx-auto flex h-5 w-full max-w-[min(60%,320px)] items-center justify-center rounded-md text-[10px] tracking-tight md:h-6 md:text-[11px] ${
            dark ? "bg-white/[0.06] text-white/50" : "bg-white text-black/45"
          }`}
        >
          {url}
        </div>
        <div className="w-10" />
      </div>
      <ScaledSite width={1280} className={aspect}>
        {children}
      </ScaledSite>
    </div>
  );
}

/** A phone silhouette around a scaled mobile render. */
export function PhoneFrame({
  children,
  className = "",
  screenBg = "#fff",
}: {
  children: ReactNode;
  className?: string;
  screenBg?: string;
}) {
  return (
    <div
      className={`rounded-[2.4rem] bg-[#111] p-[7px] shadow-device ring-1 ring-black/10 ${className}`}
    >
      <div className="relative overflow-hidden rounded-[2rem]" style={{ background: screenBg }}>
        <div className="absolute left-1/2 top-2 z-10 h-[18px] w-[30%] -translate-x-1/2 rounded-full bg-[#111]" />
        <ScaledSite width={390} className="aspect-[390/844]">
          <div className="pt-8">{children}</div>
        </ScaledSite>
      </div>
    </div>
  );
}
