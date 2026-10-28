"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { computeTotals, getPackage, type PackageId } from "@/lib/catalog";
import { ArrowLeft, ArrowRight, Lock } from "@/components/ui/icons";
import { useI18n } from "@/i18n/client";
import { fmt, formatPrice, plur } from "@/i18n/format";
import type { ClientMessages } from "@/i18n/messages";
import { SITE } from "@/lib/site";
import { AssetsStep } from "./assets-step";
import {
  DEFAULT_PAGES,
  EMPTY_DRAFT,
  NON_PERSISTED,
  STEP_IDS,
  validateStep,
  withDerivedAddOns,
  type Draft,
  type StepId,
} from "./draft";
import { OrderSummary } from "./order-summary";
import { ReviewStep } from "./review-step";
import { AddOnsStep, ConfigureStep, DetailsStep, PackageStep } from "./steps";

/**
 * Progress is kept in sessionStorage: it survives refreshes and the round trip
 * to Stripe, but is discarded when the tab closes, so customer details don't
 * linger on shared computers.
 */
export const STORAGE_KEY = "masion:configurator:v2";
const CHECKOUT_TIMEOUT_MS = 25_000;

const stepIndex = (id: StepId) => STEP_IDS.indexOf(id);
const isStep = (v: string | null): v is StepId => (STEP_IDS as readonly string[]).includes(v ?? "");
const hasErrors = (step: StepId, draft: Draft) => Object.keys(validateStep(step, draft)).length > 0;

function defaultPages(m: ClientMessages, id: PackageId) {
  return DEFAULT_PAGES[id].map((k) => m.pageNames[k]);
}

function readSaved(): Partial<Draft> {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Partial<Draft>;
    for (const key of NON_PERSISTED) delete parsed[key];
    return parsed;
  } catch {
    return {};
  }
}

function loadInitialState(m: ClientMessages): { draft: Draft; step: StepId; notice: string | null } {
  let draft: Draft = { ...EMPTY_DRAFT, ...readSaved() };
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("package");
  let step: StepId = "package";

  if (getPackage(requested)) {
    const id = requested as PackageId;
    if (draft.packageId !== id) draft = { ...draft, packageId: id, pages: defaultPages(m, id) };
    step = "configure";
  } else if (draft.packageId) {
    step = "configure";
  }

  const wanted = params.get("step");
  if (isStep(wanted)) {
    // Only jump ahead if everything before it is complete.
    const blocker = STEP_IDS.slice(0, stepIndex(wanted)).find((s) => hasErrors(s, draft));
    step = blocker ?? wanted;
  }

  const notice = params.get("cancelled") ? m.configurator.cancelledNotice : null;
  return { draft: withDerivedAddOns(draft), step, notice };
}

type ApiError = { code?: keyof ClientMessages["configurator"]["errors"]; fields?: Record<string, string> };

export default function Configurator() {
  const { locale, m } = useI18n();
  const c = m.configurator;
  const [initial] = useState(() => loadInitialState(m));
  const [draft, setDraft] = useState<Draft>(initial.draft);
  const [step, setStep] = useState<StepId>(initial.step);
  // Error codes (translated at render time). Server codes are kept until the field changes.
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Persist progress for this tab (never the agreement checkboxes or honeypot).
  useEffect(() => {
    try {
      const copy: Partial<Draft> = { ...draft };
      for (const key of NON_PERSISTED) delete copy[key];
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch {
      /* storage unavailable — the form still works */
    }
  }, [draft]);

  // Keep the URL in sync with the current step (no personal data in the URL).
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("step", step);
    url.searchParams.delete("cancelled");
    url.searchParams.delete("package");
    window.history.replaceState(window.history.state, "", url);
  }, [step]);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      document.getElementById("step-title")?.focus({ preventScroll: true });
      top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
    return () => window.clearTimeout(t);
  }, [step]);

  const update = useCallback((patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
    setDraft((d) => withDerivedAddOns({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
    setServerError(null);
    setServerFieldErrors({});
  }, []);

  const goTo = (next: StepId) => {
    setErrors({});
    setServerFieldErrors({});
    setShowSummary(false);
    setStep(next);
    setNotice(null);
  };

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs);
    setShowSummary(true);
    requestAnimationFrame(() => {
      const first = Object.keys(errs)[0];
      const el = first ? document.getElementById(first) : null;
      (el ?? document.getElementById("error-summary"))?.focus();
    });
  };

  const onPackageSelect = (id: PackageId) => {
    setDraft((d) => {
      // Reset the page list to the package defaults unless the customer customised it.
      const defaults = d.packageId ? defaultPages(m, d.packageId) : [];
      const untouched = d.pages.length === 0 || d.pages.join() === defaults.join();
      return withDerivedAddOns({ ...d, packageId: id, pages: untouched ? defaultPages(m, id) : d.pages });
    });
  };

  const next = () => {
    const errs = validateStep(step, draft);
    if (Object.keys(errs).length) return showErrors(errs);
    const i = stepIndex(step);
    if (i < STEP_IDS.length - 1) goTo(STEP_IDS[i + 1]);
  };

  const back = () => {
    const i = stepIndex(step);
    if (i > 0) goTo(STEP_IDS[i - 1]);
  };

  const submit = async () => {
    if (submitting) return;
    const errs = validateStep("review", draft);
    if (Object.keys(errs).length) return showErrors(errs);
    const invalid = STEP_IDS.find((s) => s !== "review" && hasErrors(s, draft));
    if (invalid) {
      goTo(invalid);
      return;
    }

    if (process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1") {
      setServerError(c.previewNotice);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), CHECKOUT_TIMEOUT_MS);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, locale }),
        signal: controller.signal,
      });
      const body = (await res.json().catch(() => ({}))) as ApiError & { url?: string };
      // Only ever redirect to Stripe's hosted checkout.
      if (res.ok && typeof body.url === "string" && body.url.startsWith("https://checkout.stripe.com/")) {
        window.location.assign(body.url);
        return;
      }
      if (res.status === 422 && body.fields) {
        const bad = STEP_IDS.find((s) => hasErrors(s, draft)) ?? "details";
        if (bad !== step) goTo(bad);
        setServerFieldErrors(body.fields);
        setShowSummary(true);
      }
      setServerError(c.errors[body.code ?? "generic"] ?? c.errors.generic);
    } catch (err) {
      setServerError(err instanceof DOMException && err.name === "AbortError" ? c.errors.timeout : c.errors.network);
    } finally {
      window.clearTimeout(timer);
    }
    setSubmitting(false);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "review") void submit();
    else next();
  };

  const clearSaved = () => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setDraft(EMPTY_DRAFT);
    setErrors({});
    setShowSummary(false);
    setStep("package");
    setNotice(c.clearedSaved);
  };

  // Client errors disappear as soon as the field becomes valid; all codes are translated here.
  const live = validateStep(step, draft);
  const translate = (code: string) => m.validation[code as keyof typeof m.validation] ?? m.validation.invalid;
  const shownErrors: Record<string, string> = {};
  for (const k of Object.keys(errors)) if (live[k]) shownErrors[k] = translate(live[k]);
  for (const [k, code] of Object.entries(serverFieldErrors)) shownErrors[k] ??= translate(code);
  const errorCount = Object.keys(shownErrors).length;

  const current = stepIndex(step);
  const pkg = getPackage(draft.packageId);
  const totals = pkg ? computeTotals(pkg.id, draft.addOns) : null;
  const total = totals ? formatPrice(locale, totals.total) : "—";
  const isReview = step === "review";
  const canVisit = (i: number) => i <= current || STEP_IDS.slice(0, i).every((s) => !hasErrors(s, draft));

  return (
    <div ref={top} className="container-page scroll-mt-[calc(var(--nav-height)+8px)] pb-40 pt-8 md:pb-24 md:pt-12">
      <nav aria-label={c.progressLabel} className="mb-10 md:mb-14">
        <div className="mb-4 h-[2px] overflow-hidden rounded-full bg-line md:hidden" aria-hidden>
          <motion.div
            className="h-full bg-ink"
            animate={{ width: `${((current + 1) / STEP_IDS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        <ol className="no-scrollbar -mx-[var(--space-gutter)] flex gap-1 overflow-x-auto px-[var(--space-gutter)] py-1">
          {STEP_IDS.map((s, i) => {
            const state = i === current ? "current" : i < current ? "done" : "todo";
            return (
              <li key={s} className="shrink-0">
                <button
                  type="button"
                  disabled={!canVisit(i) || submitting}
                  onClick={() => goTo(s)}
                  aria-current={state === "current" ? "step" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-full px-3.5 text-[13.5px] transition-colors disabled:cursor-not-allowed ${
                    state === "current" ? "bg-ink text-canvas" : state === "done" ? "text-ink hover:bg-surface" : "text-muted"
                  }`}
                >
                  <span className="font-mono text-[11px]" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {c.steps[s]}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <form id="order-form" noValidate onSubmit={onSubmit} className="min-w-0 lg:col-span-7" aria-labelledby="step-title">
          {notice && (
            <div role="status" className="mb-8 rounded-[var(--radius-md)] border border-line bg-surface p-4 text-[14px] text-ink-soft">
              {notice}
            </div>
          )}

          {showSummary && errorCount > 0 && (
            <div
              id="error-summary"
              role="alert"
              tabIndex={-1}
              className="mb-8 rounded-[var(--radius-md)] border border-danger/40 bg-danger/5 p-4 text-[14px] text-danger outline-none"
            >
              {plur(locale, c.errorSummary, errorCount)}
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
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

          <div className="mt-12 hidden items-center justify-between gap-4 border-t border-line pt-8 md:flex">
            <button
              type="button"
              onClick={back}
              disabled={current === 0 || submitting}
              className="btn btn-ghost gap-2 disabled:invisible"
            >
              <ArrowLeft /> {c.back}
            </button>
            {isReview ? (
              <button type="submit" disabled={submitting} aria-busy={submitting} className="btn btn-primary h-13 min-w-[220px] px-8">
                <Lock size={14} />
                {submitting ? c.redirecting : fmt(c.pay, { amount: total })}
              </button>
            ) : (
              <button type="submit" disabled={uploading} className="btn btn-primary group h-13 px-8">
                {uploading ? c.uploading : c.continue}
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
              </button>
            )}
          </div>
        </form>

        <aside className="hidden lg:col-span-5 lg:block">
          <div className="sticky top-[calc(var(--nav-height)+24px)]">
            <OrderSummary draft={draft} />
            <p className="mt-5 px-2 text-[13px] leading-relaxed text-muted">
              {c.questions.split("{email}")[0]}
              <a href={`mailto:${SITE.email}`} className="text-ink underline underline-offset-4">
                {SITE.email}
              </a>
              {c.questions.split("{email}")[1]}
            </p>
            <button type="button" onClick={clearSaved} className="mt-2 min-h-10 px-2 text-[13px] text-muted underline underline-offset-4 hover:text-ink">
              {c.clearSaved}
            </button>
          </div>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/95 backdrop-blur-xl md:hidden">
        <div className="container-page flex items-center gap-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {current > 0 && (
            <button
              type="button"
              onClick={back}
              disabled={submitting}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-strong"
              aria-label={c.back}
            >
              <ArrowLeft />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-muted">{c.total}</p>
            <p className="truncate font-medium tracking-[-0.02em]">{total}</p>
          </div>
          {isReview ? (
            <button form="order-form" type="submit" disabled={submitting} aria-busy={submitting} className="btn btn-primary min-w-0 px-5">
              <Lock size={14} />
              <span className="truncate">{submitting ? c.redirectingShort : c.paySecurely}</span>
            </button>
          ) : (
            <button form="order-form" type="submit" disabled={uploading} className="btn btn-primary min-w-0 px-5">
              <span className="truncate">{uploading ? c.uploading : c.continue}</span> <ArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
