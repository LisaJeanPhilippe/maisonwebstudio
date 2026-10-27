"use client";

import { useState } from "react";

/** Slow scrolling list of industries, with a pause control (WCAG 2.2.2). */
export function IndustriesMarquee({
  items,
  label,
  pauseLabel,
  playLabel,
}: {
  items: string[];
  label: string;
  pauseLabel: string;
  playLabel: string;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <section aria-label={label} className="relative border-b border-line">
      <ul className="sr-only">
        {items.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <div className="group overflow-hidden py-6 pe-14" aria-hidden dir="ltr">
        <div
          className={`flex w-max animate-marquee gap-12 whitespace-nowrap text-[15px] text-muted group-hover:[animation-play-state:paused] motion-reduce:animate-none ${
            paused ? "[animation-play-state:paused]" : ""
          }`}
        >
          {[...items, ...items].map((name, i) => (
            <span key={i} className="flex items-center gap-12">
              {name}
              <span className="h-1 w-1 rounded-full bg-line-strong" />
            </span>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? playLabel : pauseLabel}
        className="absolute end-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-canvas text-ink hover:border-ink motion-reduce:hidden"
      >
        {paused ? (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false"><path d="M5 3.5v9l7-4.5z" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden focusable="false"><path d="M5 3.5v9M11 3.5v9" stroke="currentColor" strokeWidth="2" /></svg>
        )}
      </button>
    </section>
  );
}
