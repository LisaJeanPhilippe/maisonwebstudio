"use client";

import { LocaleLink, useI18n } from "@/i18n/client";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden focusable="false">
      <rect width="28" height="28" rx="8" fill="currentColor" />
      <path d="M8 20V11.5a6 6 0 0112 0V20" stroke="var(--color-canvas)" strokeWidth="1.8" fill="none" />
      <path d="M14 20v-6" stroke="var(--color-canvas)" strokeWidth="1.8" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  const { m } = useI18n();
  return (
    <LocaleLink href="/" className={`group inline-flex min-h-11 items-center gap-2.5 ${className}`} aria-label={m.nav.home}>
      <LogoMark className="h-7 w-7 text-ink transition-transform duration-500 ease-out-soft group-hover:rotate-[-6deg]" />
      <span className="text-[15px] font-semibold tracking-[-0.02em]" dir="ltr">
        Maison <span className="font-normal text-muted">Web Studio</span>
      </span>
    </LocaleLink>
  );
}
