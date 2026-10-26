import Link from "next/link";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden>
      <rect width="28" height="28" rx="8" fill="currentColor" />
      <path d="M8 20V11.5a6 6 0 0112 0V20" stroke="var(--color-canvas)" strokeWidth="1.8" fill="none" />
      <path d="M14 20v-6" stroke="var(--color-canvas)" strokeWidth="1.8" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex items-center gap-2.5 ${className}`} aria-label="Masion Web Studio — home">
      <LogoMark className="h-7 w-7 text-ink transition-transform duration-500 ease-out-soft group-hover:rotate-[-6deg]" />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">
        Masion <span className="font-normal text-muted">Web Studio</span>
      </span>
    </Link>
  );
}
