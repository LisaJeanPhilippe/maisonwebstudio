"use client";

import { LocaleLink, useI18n } from "@/i18n/client";

export function NotFoundContent() {
  const { m } = useI18n();
  const links = [
    { href: "/work", label: m.nav.work },
    { href: "/services", label: m.nav.services },
    { href: "/pricing", label: m.nav.pricing },
    { href: "/start", label: m.common.startYourWebsite },
  ];
  return (
    <section className="container-page grid min-h-[70vh] place-items-center py-24 text-center">
      <div className="max-w-xl">
        <p className="eyebrow mb-6">{m.notFound.eyebrow}</p>
        <h1 className="text-headline font-medium text-balance">{m.notFound.title}</h1>
        <p className="mt-6 text-lede text-muted">{m.notFound.body}</p>
        <LocaleLink href="/" className="btn btn-primary mt-10">
          {m.common.backToHome}
        </LocaleLink>
        <nav aria-label={m.notFound.popular} className="mt-12">
          <h2 className="eyebrow mb-4">{m.notFound.popular}</h2>
          <ul className="flex flex-wrap justify-center gap-2">
            {links.map((l) => (
              <li key={l.href}>
                <LocaleLink href={l.href} className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-4 text-[14px] hover:border-ink">
                  {l.label}
                </LocaleLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
