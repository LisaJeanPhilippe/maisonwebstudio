import type { LegalDocument } from "@/content/legal/types";
import type { Locale } from "@/i18n/config";
import { fmt, formatDate } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { SITE } from "@/lib/site";

/** Legal documents are English-only until professionally translated (marked lang="en"). */
export function LegalPage({ locale, m, title, doc }: { locale: Locale; m: Messages; title: string; doc: LegalDocument }) {
  return (
    <article className="container-page pb-28 pt-16 md:pt-24">
      <header className="max-w-3xl">
        <h1 className="text-headline font-medium text-balance">{title}</h1>
        <p className="mt-4 text-[14px] text-muted">{fmt(m.legal.lastUpdated, { date: formatDate(locale, SITE.legalLastUpdated) })}</p>
        {SITE.legalReviewPending && (
          <p role="note" className="mt-6 rounded-[var(--radius-sm)] border border-line-strong bg-surface p-4 text-[14px] text-ink-soft">
            {m.legal.draftNotice}
          </p>
        )}
        {locale !== "en" && (
          <p role="note" className="mt-4 rounded-[var(--radius-sm)] border border-line bg-surface p-4 text-[14px] text-ink-soft">
            {m.legal.englishOnly}
          </p>
        )}
      </header>

      <div lang="en" dir="ltr" className="mt-12 max-w-3xl text-start">
        <p className="text-lede text-ink-soft">{doc.intro}</p>
        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-12 border-t border-line pt-8">
            <h2 className="text-[1.375rem] font-medium tracking-[-0.025em]">{section.heading}</h2>
            <div className="mt-4 space-y-4 text-[15.5px] leading-relaxed text-ink-soft">
              {section.body.map((block, i) =>
                typeof block === "string" ? (
                  <p key={i}>{block}</p>
                ) : (
                  <ul key={i} className="list-disc space-y-2 ps-6 marker:text-muted">
                    {block.list.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
