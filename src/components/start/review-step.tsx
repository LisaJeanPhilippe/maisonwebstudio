"use client";

import { computeTotals, getPackage, type IndustryId } from "@/lib/catalog";
import { Lock } from "@/components/ui/icons";
import { LocaleLink, useI18n } from "@/i18n/client";
import { fmt, formatPrice, plur } from "@/i18n/format";
import { AGREEMENT_CHECKBOX, PAYMENT_AGREEMENT_POINTS, TERMS_CHECKBOX } from "@/i18n/legal-en";
import type { StepId } from "./draft";
import { StepHeader } from "./fields";
import { useStepLabel, type StepProps } from "./steps";

export function ReviewStep({
  draft,
  update,
  errors,
  goTo,
  serverError,
}: StepProps & { goTo: (step: StepId) => void; serverError: string | null }) {
  const { locale, m } = useI18n();
  const c = m.configurator.review;
  const stepLabel = useStepLabel("review");
  const pkg = getPackage(draft.packageId);
  if (!pkg) return null;
  const totals = computeTotals(pkg.id, draft.addOns);
  const amount = formatPrice(locale, totals.total);
  const copy = m.packages[pkg.id];
  const style = draft.style in m.styles ? m.styles[draft.style as keyof typeof m.styles].name : "—";
  const industry = m.industries[draft.industry as IndustryId] ?? draft.industry;

  const sections: { title: string; step: StepId; rows: [string, string][] }[] = [
    {
      title: c.sections.website,
      step: "configure",
      rows: [
        [c.rows.package, copy.name],
        [c.rows.style, style],
        [c.rows.pages, draft.pages.join(", ")],
        [c.rows.timeline, draft.addOns.rush ? copy.rushTimeline : copy.timeline],
        ...(draft.colorNotes ? ([[c.rows.brandNotes, draft.colorNotes]] as [string, string][]) : []),
      ],
    },
    {
      title: c.sections.project,
      step: "details",
      rows: [
        [c.rows.contact, [draft.fullName, draft.email, draft.phone].filter(Boolean).join(" · ")],
        [c.rows.business, `${draft.businessName} — ${industry}`],
        [c.rows.goals, draft.goals],
        ...(draft.currentWebsite ? ([[c.rows.currentWebsite, draft.currentWebsite]] as [string, string][]) : []),
      ],
    },
    {
      title: c.sections.assets,
      step: "assets",
      rows: [[c.rows.files, plur(locale, c.filesUploaded, draft.files.length)]],
    },
  ];

  return (
    <>
      <StepHeader step={stepLabel} title={c.title} description={c.description} />

      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.title} aria-label={s.title} className="rounded-[var(--radius-md)] border border-line bg-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-medium tracking-[-0.02em]">{s.title}</h2>
              <button
                type="button"
                onClick={() => goTo(s.step)}
                aria-label={fmt(c.editSection, { section: s.title })}
                className="min-h-10 px-2 text-[13px] text-muted underline underline-offset-4 hover:text-ink"
              >
                {c.edit}
              </button>
            </div>
            <dl className="space-y-3 text-[14.5px]">
              {s.rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="whitespace-pre-line break-words" dir="auto">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section aria-labelledby="payment-agreement-title" className="mt-10 rounded-[var(--radius-md)] border border-line bg-surface p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="payment-agreement-title" className="font-medium tracking-[-0.02em]">
            {c.agreementTitle}
          </h2>
          <span className="text-[1.5rem] font-medium tracking-[-0.03em]">{amount}</span>
        </div>
        {locale !== "en" && <p className="mt-3 text-[13px] text-muted">{c.englishBinding}</p>}
        <ul lang="en" dir="ltr" className="mt-4 space-y-2 text-start text-[14.5px] leading-relaxed text-ink-soft">
          {PAYMENT_AGREEMENT_POINTS.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <LocaleLink
          href="/payment-agreement"
          target="_blank"
          className="mt-4 inline-flex min-h-10 items-center text-[13.5px] text-muted underline underline-offset-4 hover:text-ink"
        >
          {c.readAgreement}
          <span className="sr-only"> {m.common.opensInNewTab}</span>
        </LocaleLink>
      </section>

      <fieldset className="mt-6 space-y-4">
        <legend className="sr-only">{c.agreementTitle}</legend>
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[14.5px]">
            <input
              id="acceptPaymentAgreement"
              type="checkbox"
              checked={draft.acceptPaymentAgreement}
              onChange={(e) => update({ acceptPaymentAgreement: e.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#111]"
              aria-invalid={errors.acceptPaymentAgreement ? true : undefined}
              aria-describedby={errors.acceptPaymentAgreement ? "acceptPaymentAgreement-error" : undefined}
              required
            />
            <span lang="en" className="text-ink-soft">
              {AGREEMENT_CHECKBOX(amount)}
            </span>
          </label>
          {errors.acceptPaymentAgreement && (
            <p id="acceptPaymentAgreement-error" className="field-error">
              {errors.acceptPaymentAgreement}
            </p>
          )}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-3 text-[14.5px]">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={draft.acceptTerms}
              onChange={(e) => update({ acceptTerms: e.target.checked })}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#111]"
              aria-invalid={errors.acceptTerms ? true : undefined}
              aria-describedby={errors.acceptTerms ? "acceptTerms-error" : undefined}
              required
            />
            <span lang="en" className="text-ink-soft">
              {TERMS_CHECKBOX.before}
              <LocaleLink href="/terms" target="_blank" className="underline underline-offset-4">
                {TERMS_CHECKBOX.link}
              </LocaleLink>
              {TERMS_CHECKBOX.after}
            </span>
          </label>
          {errors.acceptTerms && (
            <p id="acceptTerms-error" className="field-error">
              {errors.acceptTerms}
            </p>
          )}
        </div>
      </fieldset>

      <p className="mt-6 text-[13px] text-muted">
        {c.privacyNote}{" "}
        <LocaleLink href="/privacy" target="_blank" className="underline underline-offset-4 hover:text-ink">
          {c.privacyLink}
          <span className="sr-only"> {m.common.opensInNewTab}</span>
        </LocaleLink>
      </p>

      {serverError && (
        <div role="alert" className="mt-6 rounded-[var(--radius-sm)] border border-danger/40 bg-danger/5 p-4 text-[14px] text-danger">
          {serverError}
        </div>
      )}

      <p className="mt-8 flex items-center gap-2 text-[13px] text-muted">
        <Lock size={14} /> {fmt(c.secure, { amount })}
      </p>
    </>
  );
}
