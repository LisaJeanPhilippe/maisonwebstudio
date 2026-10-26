"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { computeTotals, formatPrice, getPackage, type PackageId } from "@/lib/catalog";
import { ArrowLeft, ArrowRight, Lock } from "@/components/ui/icons";
import { AssetsStep } from "./assets-step";
import {
  DEFAULT_PAGES,
  EMPTY_DRAFT,
  STEPS,
  validateStep,
  withDerivedAddOns,
  type Draft,
  type StepId,
} from "./draft";
import { OrderSummary } from "./order-summary";
import { ReviewStep } from "./review-step";
import { AddOnsStep, ConfigureStep, DetailsStep, PackageStep } from "./steps";

export const STORAGE_KEY = "masion:configurator:v1";

const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);
const isStep = (v: string | null): v is StepId => STEPS.some((s) => s.id === v);

function firstInvalidStep(draft: Draft): StepId | null {
  for (const s of STEPS) if (Object.keys(validateStep(s.id, draft)).length) return s.id;
  return null;
}

function loadInitialState(): { draft: Draft; step: StepId; notice: string | null } {
  let draft: Draft = EMPTY_DRAFT;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) draft = { ...EMPTY_DRAFT, ...JSON.parse(saved), acceptTerms: false };
  } catch {
    /* storage unavailable — start fresh */
  }

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("package");
  let step: StepId = "package";

  if (getPackage(requested)) {
    const id = requested as PackageId;
    if (draft.packageId !== id) draft = { ...draft, packageId: id, pages: DEFAULT_PAGES[id] };
    step = "configure";
  } else if (draft.packageId) {
    step = "configure";
  }

  const wanted = params.get("step");
  if (isStep(wanted)) {
    // Only jump ahead if everything before it is complete.
    const blocker = STEPS.slice(0, stepIndex(wanted)).find((s) => Object.keys(validateStep(s.id, draft)).length);
    step = blocker ? blocker.id : wanted;
  }

  const notice = params.get("cancelled")
    ? "Payment was cancelled — nothing was charged. Your details are saved, so you can pick up right here."
    : null;
  return { draft: withDerivedAddOns(draft), step, notice };
}

export default function Configurator() {
  const [initial] = useState(loadInitialState);
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [step, setStep] = useState<StepId>(initial.step);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  // Persist progress locally so a refresh or cancelled payment doesn't lose work.
  useEffect(() => {
    try {
      const { acceptTerms: _ignored, ...rest } = draft;
      void _ignored;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  }, [draft]);

  // Keep the URL in sync with the current step.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step);
    url.searchParams.delete("cancelled");
    url.searchParams.delete("package");
    window.history.replaceState(null, "", url);
  }, [step]);

  const update = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => withDerivedAddOns({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
    setServerError(null);
  }, []);

  const goTo = (next: StepId) => {
    setErrors({});
    setStep(next);
    setNotice(null);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const focusFirstError = (errs: Record<string, string>) => {
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0];
      const el = first ? document.getElementById(first.split(".")[0]) : null;
      if (el) el.focus({ preventScroll: false });
      else top.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  const onPackageSelect = (id: PackageId) => {
    setDraft((d) => {
      // Reset the page list to sensible defaults when switching packages,
      // unless the customer has already customised it.
      const defaults = d.packageId ? DEFAULT_PAGES[d.packageId] : [];
      const untouched = d.pages.length === 0 || d.pages.join() === defaults.join();
      return withDerivedAddOns({ ...d, packageId: id, pages: untouched ? DEFAULT_PAGES[id] : d.pages });
    });
  };

  const next = () => {
    const errs = validateStep(step, draft);
    if (Object.keys(errs).length) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    const i = stepIndex(step);
    if (i < STEPS.length - 1) goTo(STEPS[i + 1].id);
  };

  const back = () => {
    const i = stepIndex(step);
    if (i > 0) goTo(STEPS[i - 1].id);
  };

  const submit = async () => {
    const errs = validateStep("review", draft);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    const invalid = firstInvalidStep(draft);
    if (invalid && invalid !== "review") {
      goTo(invalid);
      setErrors(validateStep(invalid, draft));
      return;
    }

    if (process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1") {
      setServerError(
        "This is a preview link, so payments are turned off. On the live site this button opens secure Stripe Checkout.",
      );
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.url) {
        window.location.assign(body.url);
        return;
      }
      if (res.status === 422 && body.fields) {
        const bad = STEPS.find((s) => Object.keys(validateStep(s.id, draft)).length)?.id ?? "details";
        goTo(bad);
        setErrors(body.fields);
      }
      setServerError(body.error || "Something went wrong. Please try again.");
    } catch {
      setServerError("We couldn’t reach the server. Check your connection and try again.");
    }
    setSubmitting(false);
  };

  // Errors disappear as soon as the field becomes valid.
  const live = validateStep(step, draft);
  const shownErrors: Record<string, string> = {};
  for (const k of Object.keys(errors)) if (live[k]) shownErrors[k] = live[k];

  const current = stepIndex(step);
  const pkg = getPackage(draft.packageId);
  const totals = pkg ? computeTotals(pkg.id, draft.addOns, draft.paymentPlan) : null;
  const isReview = step === "review";
  const canVisit = (i: number) => i <= current || STEPS.slice(0, i).every((s) => !Object.keys(validateStep(s.id, draft)).length);

  return (
    <div ref={top} className="container-page scroll-mt-[calc(var(--nav-height)+8px)] pb-40 pt-8 md:pb-24 md:pt-12">
      {/* Progress */}
      <nav aria-label="Checkout progress" className="mb-10 md:mb-14">
        <div className="mb-4 h-[2px] overflow-hidden rounded-full bg-line md:hidden">
          <motion.div
            className="h-full bg-ink"
            animate={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <ol className="no-scrollbar -mx-[var(--space-gutter)] flex gap-1 overflow-x-auto px-[var(--space-gutter)]">
          {STEPS.map((s, i) => {
            const state = i === current ? "current" : i < current ? "done" : "todo";
            return (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  disabled={!canVisit(i) || submitting}
                  onClick={() => goTo(s.id)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] transition-colors disabled:cursor-not-allowed ${
                    state === "current"
                      ? "bg-ink text-canvas"
                      : state === "done"
                        ? "text-ink hover:bg-surface"
                        : "text-subtle"
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-60">0{i + 1}</span>
                  {s.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          {notice && (
            <div role="status" className="mb-8 rounded-[var(--radius-md)] border border-line bg-surface p-4 text-[14px] text-ink-soft">
              {notice}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === "package" && (
                <PackageStep draft={draft} update={update} errors={shownErrors} onSelect={onPackageSelect} />
              )}
              {step === "configure" && <ConfigureStep draft={draft} update={update} errors={shownErrors} />}
              {step === "addons" && <AddOnsStep draft={draft} update={update} errors={shownErrors} />}
              {step === "details" && <DetailsStep draft={draft} update={update} errors={shownErrors} />}
              {step === "assets" && (
                <AssetsStep draft={draft} update={update} errors={shownErrors} onBusyChange={setUploading} />
              )}
              {isReview && (
                <>
                  <ReviewStep draft={draft} update={update} errors={shownErrors} goTo={goTo} serverError={serverError} />
                  <div className="mt-10 lg:hidden">
                    <OrderSummary draft={draft} />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Desktop actions */}
          <div className="mt-12 hidden items-center justify-between border-t border-line pt-8 md:flex">
            <button type="button" onClick={back} disabled={current === 0 || submitting} className="btn btn-ghost gap-2 disabled:invisible">
              <ArrowLeft /> Back
            </button>
            {isReview ? (
              <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary h-13 min-w-[220px] px-8">
                <Lock size={14} />
                {submitting ? "Redirecting to Stripe…" : `Pay ${totals ? formatPrice(totals.dueToday) : ""} securely`}
              </button>
            ) : (
              <button type="button" onClick={next} disabled={uploading} className="btn btn-primary group h-13 px-8">
                {uploading ? "Uploading…" : "Continue"}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-[calc(var(--nav-height)+24px)]">
            <OrderSummary draft={draft} />
            <p className="mt-5 px-2 text-[13px] leading-relaxed text-muted">
              Questions before you order? Email{" "}
              <a href="mailto:hello@masionwebstudio.com" className="text-ink underline underline-offset-4">
                hello@masionwebstudio.com
              </a>
              .
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 backdrop-blur-xl md:hidden">
        <div className="container-page flex items-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {current > 0 && (
            <button type="button" onClick={back} disabled={submitting} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-strong" aria-label="Back">
              <ArrowLeft />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">{isReview ? "Due today" : "Total"}</p>
            <p className="truncate font-medium tracking-[-0.02em]">
              {totals ? formatPrice(isReview ? totals.dueToday : totals.subtotal) : "—"}
            </p>
          </div>
          {isReview ? (
            <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary">
              <Lock size={14} />
              {submitting ? "Redirecting…" : "Pay securely"}
            </button>
          ) : (
            <button type="button" onClick={next} disabled={uploading} className="btn btn-primary">
              {uploading ? "Uploading…" : "Continue"} <ArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
