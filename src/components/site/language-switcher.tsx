"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_META, localizePath, splitLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";

function rememberLocale(locale: Locale) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden focusable="false">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M1.75 8h12.5M8 1.75c1.8 1.9 2.6 3.9 2.6 6.25S9.8 12.35 8 14.25C6.2 12.35 5.4 10.35 5.4 8S6.2 3.65 8 1.75z" />
    </svg>
  );
}

function useAlternateHrefs() {
  const pathname = usePathname() || "/";
  const { path } = splitLocale(pathname);
  return (locale: Locale) => localizePath(locale, path);
}

/** Plain list of language links (mobile menu, footer). */
export function LanguageList({ className = "" }: { className?: string }) {
  const { locale, m } = useI18n();
  const hrefFor = useAlternateHrefs();
  return (
    <ul className={className} aria-label={m.language.listLabel}>
      {LOCALES.map((l) => (
        <li key={l}>
          <a
            href={hrefFor(l)}
            hrefLang={LOCALE_META[l].tag}
            lang={LOCALE_META[l].tag}
            aria-current={l === locale ? "true" : undefined}
            onClick={() => rememberLocale(l)}
            className={`inline-flex min-h-10 items-center rounded-full px-3 text-[14px] transition-colors ${
              l === locale ? "bg-ink text-canvas" : "text-ink-soft hover:bg-surface hover:text-ink"
            }`}
          >
            {LOCALE_META[l].name}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Compact disclosure menu for the header. */
export function LanguageMenu() {
  const { locale, m } = useI18n();
  const hrefFor = useAlternateHrefs();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLAnchorElement>('[aria-current="true"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (open && !e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={fmt(m.language.button, { name: LOCALE_META[locale].name })}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] text-ink-soft transition-colors hover:bg-surface hover:text-ink"
      >
        <GlobeIcon />
        <span className="uppercase" aria-hidden>
          {locale}
        </span>
      </button>
      {open && (
        <div
          ref={panel}
          id={listId}
          className="absolute end-0 top-full z-50 mt-2 w-56 rounded-[var(--radius-md)] border border-line bg-surface p-2 shadow-lift"
        >
          <p className="px-3 pb-2 pt-1 text-[12px] text-muted">{m.language.listLabel}</p>
          <ul>
            {LOCALES.map((l) => (
              <li key={l}>
                <a
                  href={hrefFor(l)}
                  hrefLang={LOCALE_META[l].tag}
                  lang={LOCALE_META[l].tag}
                  aria-current={l === locale ? "true" : undefined}
                  onClick={() => rememberLocale(l)}
                  className={`flex min-h-10 items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 text-[14.5px] ${
                    l === locale ? "bg-canvas font-medium text-ink" : "text-ink-soft hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {LOCALE_META[l].name}
                  {l === locale && <span aria-hidden>✓</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
