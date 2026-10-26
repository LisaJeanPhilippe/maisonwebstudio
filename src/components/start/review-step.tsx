"use client";

import Link from "next/link";
import {
  DEPOSIT_RATE,
  STYLE_DIRECTIONS,
  computeTotals,
  estimatedTimeline,
  formatPrice,
  getPackage,
} from "@/lib/catalog";
import { Check, Lock } from "@/components/ui/icons";
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
  const totals = computeTotals(pkg.id, draft.addOns, draft.paymentPlan);
  const full = computeTotals(pkg.id, draft.addOns, "full");
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

      <fieldset className="mt-10">
        <legend className="field-label mb-3">Payment</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["full", "Pay in full", formatPrice(full.subtotal), "Everything settled today."],
              [
                "deposit",
                `Pay ${DEPOSIT_RATE * 100}% deposit`,
                formatPrice(computeTotals(pkg.id, draft.addOns, "deposit").dueToday),
                `Balance of ${formatPrice(full.subtotal - computeTotals(pkg.id, draft.addOns, "deposit").dueToday)} due at launch.`,
              ],
            ] as const
          ).map(([value, label, amount, note]) => {
            const selected = draft.paymentPlan === value;
            return (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border bg-surface p-5 transition-[border-color,box-shadow] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
                  selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="paymentPlan"
                  value={value}
                  checked={selected}
                  onChange={() => update({ paymentPlan: value })}
                  className="sr-only"
                />
                <span
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    selected ? "border-ink bg-ink text-canvas" : "border-line-strong"
                  }`}
                >
                  {selected && <Check size={12} />}
                </span>
                <span>
                  <span className="block font-medium">{label}</span>
                  <span className="mt-1 block text-[1.5rem] font-medium tracking-[-0.03em]">{amount}</span>
                  <span className="mt-1 block text-[13px] text-muted">{note}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-8 flex cursor-pointer items-start gap-3 text-[14.5px]">
        <input
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

      {serverError && (
        <div role="alert" className="mt-6 rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 p-4 text-[14px] text-danger">
          {serverError}
        </div>
      )}

      <p className="mt-8 flex items-center gap-2 text-[13px] text-muted">
        <Lock size={14} /> Payments are processed securely by Stripe. Total due today: {formatPrice(totals.dueToday)}.
      </p>
    </>
  );
}
