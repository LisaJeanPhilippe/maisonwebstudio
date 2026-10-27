import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { ArrowUpRight } from "@/components/ui/icons";
import { localizePath, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { SITE } from "@/lib/site";
import { LanguageList } from "./language-switcher";

export function Footer({ locale, m }: { locale: Locale; m: Messages }) {
  const l = m.footer.links;
  const href = (path: string) => localizePath(locale, path);
  const columns = [
    {
      title: m.footer.studio,
      links: [
        { href: "/work", label: l.work },
        { href: "/services", label: l.services },
        { href: "/process", label: l.process },
        { href: "/about", label: l.about },
      ],
    },
    {
      title: m.footer.start,
      links: [
        { href: "/pricing", label: l.pricing },
        { href: "/pricing#compare", label: l.compare },
        { href: "/start", label: l.configure },
        { href: "/pricing#faq", label: l.faq },
      ],
    },
    {
      title: m.footer.legal,
      links: [
        { href: "/privacy", label: l.privacy },
        { href: "/terms", label: l.terms },
        { href: "/cookies", label: l.cookies },
        { href: "/payment-agreement", label: l.payment },
        { href: "/accessibility", label: l.accessibility },
      ],
    },
  ];

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page pb-10 pt-20 md:pt-28">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="text-title max-w-md font-medium text-balance">{m.footer.tagline}</p>
            <Link href={href("/start")} className="group mt-8 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium">
              <span className="link-underline">{m.footer.startLink}</span>
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <nav aria-label={m.footer.nav} className="grid gap-10 sm:grid-cols-3 md:col-span-5">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="eyebrow mb-5">{col.title}</h2>
                <ul className="space-y-1">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={href(link.href)}
                        className="inline-flex min-h-8 items-center text-[15px] text-ink-soft hover:text-ink link-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="md:col-span-3">
            <h2 className="eyebrow mb-5">{m.footer.contact}</h2>
            <ul className="space-y-3 text-[15px] text-ink-soft">
              <li>
                <a href={`mailto:${SITE.email}`} className="[overflow-wrap:anywhere] link-underline hover:text-ink">
                  {SITE.email}
                </a>
              </li>
              <li>{m.footer.hours}</li>
              <li>{m.footer.location}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-line pt-8">
          <h2 className="eyebrow mb-3">{m.language.label}</h2>
          <LanguageList className="flex flex-wrap gap-1" />
        </div>

        <div className="mt-16 flex items-end justify-between gap-6 overflow-hidden" aria-hidden>
          <p className="select-none text-[clamp(4rem,17vw,15rem)] font-medium leading-[0.8] tracking-[-0.06em] text-ink/[0.06]" dir="ltr">
            Masion
          </p>
          <LogoMark className="mb-2 hidden h-10 w-10 shrink-0 text-ink md:block" />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:justify-between">
          <p>{fmt(m.footer.rights, { year: new Date().getUTCFullYear() })}</p>
          <p>{m.footer.slogan}</p>
        </div>
      </div>
    </footer>
  );
}
