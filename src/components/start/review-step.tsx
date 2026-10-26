"use client";

import Link from "next/link";
import {
  STYLE_DIRECTIONS,
  computeTotals,
  estimatedTimeline,
  formatPrice,
  getPackage,
} from "@/lib/catalog";
import { Lock } from "@/components/ui/icons";
import { PAYMENT_AGREEMENT_POINTS } from "@/lib/content";
import type { StepId } from "./draft";
import { StepHeader } from "./fields";
import type { StepProps } from "./steps";

export function ReviewStep({
  draft,
  update,
  errors,
  goTo,
  serverError,
}: StepProps & { goTo: (step: StepId) => void; serverError: string | null }) {
  const pkg = getPackage(draft.packageId);
  if (!pkg) return null;
  const totals = computeTotals(pkg.id, draft.addOns);
  const style = STYLE_DIRECTIONS.find((s) => s.id === draft.style)?.name ?? "—";

  const sections: { title: string; step: StepId; rows: [string, string][] }[] = [
    {
      title: "Website",
      step: "configure",
      rows: [
        ["Package", pkg.name],
        ["Design direction", style],
        ["Pages", draft.pages.join(", ")],
        ["Estimated timeline", estimatedTimeline(pkg.id, Boolean(draft.addOns.rush))],
        ...(draft.colorNotes ? ([["Brand notes", draft.colorNotes]] as [string, string][]) : []),
      ],
    },
    {
      title: "Your project",
      step: "details",
      rows: [
        ["Contact", `${draft.fullName} · ${draft.email}${draft.phone ? ` · ${draft.phone}` : ""}`],
        ["Business", `${draft.businessName} — ${draft.industry}`],
        ["Goals", draft.goals],
        ...(draft.currentWebsite ? ([["Current website", draft.currentWebsite]] as [string, string][]) : []),
      ],
    },
    {
      title: "Assets",
      step: "assets",
      rows: [
        [
          "Files",
          draft.files.length ? `${draft.files.length} file${draft.files.length > 1 ? "s" : ""} uploaded` : "None yet — you can send them later",
        ],
      ],
    },
  ];

  return (
    <>
      <StepHeader
        step="Step 6 of 6"
        title="Review your order."
        description="Check everything looks right. You’ll be taken to Stripe to complete payment securely."
      />

      <div className="space-y-4">
        {sections.map((s) => (
          <section key={s.title} className="rounded-[var(--radius-md)] border border-line bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-medium tracking-[-0.02em]">{s.title}</h2>
              <button type="button" onClick={() => goTo(s.step)} className="text-[13px] text-muted underline underline-offset-4 hover:text-ink">
                Edit
              </button>
            </div>
            <dl className="space-y-3 text-[14.5px]">
              {s.rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 sm:grid-cols-[160px_1fr] sm:gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd className="whitespace-pre-line break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section
        aria-labelledby="payment-agreement-title"
        className="mt-10 rounded-[var(--radius-md)] border border-line bg-surface p-6"
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="payment-agreement-title" className="font-medium tracking-[-0.02em]">
            Payment agreement
          </h2>
          <span className="text-[1.5rem] font-medium tracking-[-0.03em]">{formatPrice(totals.total)}</span>
        </div>
        <ul className="mt-4 space-y-2 text-[14.5px] leading-relaxed text-ink-soft">
          {PAYMENT_AGREEMENT_POINTS.map((point) => (
            <li key={point} className="flex gap-3">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
        <Link
          href="/payment-agreement"
          target="_blank"
          className="mt-4 inline-block text-[13.5px] text-muted underline underline-offset-4 hover:text-ink"
        >
          Read the full payment agreement
        </Link>
      </section>

      <div className="mt-6 space-y-4">
        <label className="flex cursor-pointer items-start gap-3 text-[14.5px]">
          <input
            id="acceptPaymentAgreement"
            type="checkbox"
            checked={draft.acceptPaymentAgreement}
            onChange={(e) => update({ acceptPaymentAgreement: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#111]"
            aria-invalid={errors.acceptPaymentAgreement ? true : undefined}
          />
          <span className="text-ink-soft">
            I agree to pay {formatPrice(totals.total)} in full today and understand that{" "}
            <strong className="font-medium text-ink">all payments are final and non-refundable</strong>.
          </span>
        </label>
        {errors.acceptPaymentAgreement && <p className="field-error">{errors.acceptPaymentAgreement}</p>}

        <label className="flex cursor-pointer items-start gap-3 text-[14.5px]">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={draft.acceptTerms}
            onChange={(e) => update({ acceptTerms: e.target.checked })}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#111]"
            aria-invalid={errors.acceptTerms ? true : undefined}
          />
          <span className="text-ink-soft">
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-4">
              project terms
            </Link>
            , including the revision rounds and timeline for my package.
          </span>
        </label>
        {errors.acceptTerms && <p className="field-error">{errors.acceptTerms}</p>}
      </div>

      {serverError && (
        <div role="alert" className="mt-6 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 p-4 text-[14px] text-danger">
          {serverError}
        </div>
      )}

      <p className="mt-8 flex items-center gap-2 text-[13px] text-muted">
        <Lock size={14} /> Payments are processed securely by Stripe. You’ll pay {formatPrice(totals.total)} in full.
      </p>
    </>
  );
}
