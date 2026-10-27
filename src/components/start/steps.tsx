"use client";

import { useState, type KeyboardEvent } from "react";
import {
  EXTRA_PAGE_PRICE,
  INDUSTRY_IDS,
  PACKAGES,
  STYLE_IDS,
  availableAddOns,
  getPackage,
  type AddOnId,
  type PackageId,
} from "@/lib/catalog";
import { Check, Close, Plus } from "@/components/ui/icons";
import { LocaleLink, useI18n } from "@/i18n/client";
import { fmt, formatPrice, plur } from "@/i18n/format";
import { PAGE_SUGGESTIONS, STEP_IDS, type Draft, type StepId } from "./draft";
import { SelectField, StepHeader, TextArea, TextField, choiceClass } from "./fields";

export type StepProps = {
  draft: Draft;
  update: (patch: Partial<Draft> | ((draft: Draft) => Partial<Draft>)) => void;
  errors: Record<string, string>;
};

export function useStepLabel(step: StepId) {
  const { m } = useI18n();
  return fmt(m.configurator.stepOf, { n: STEP_IDS.indexOf(step) + 1, total: STEP_IDS.length });
}

function SelectedDot({ selected, square = false }: { selected: boolean; square?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-5 w-5 shrink-0 place-items-center border transition-colors ${square ? "rounded-[6px]" : "rounded-full"} ${
        selected ? "border-ink bg-ink text-canvas" : "border-control bg-surface"
      }`}
    >
      {selected && <Check size={12} />}
    </span>
  );
}

/* ---------------------------------------------------------------- Package */

export function PackageStep({ draft, errors, onSelect }: StepProps & { onSelect: (id: PackageId) => void }) {
  const { locale, m } = useI18n();
  const c = m.configurator.package;
  return (
    <>
      <StepHeader step={useStepLabel("package")} title={c.title} description={c.description} />
      <fieldset aria-describedby={errors.packageId ? "packageId-error" : undefined}>
        <legend className="sr-only">{c.legend}</legend>
        <div className="grid gap-3">
          {PACKAGES.map((pkg) => {
            const copy = m.packages[pkg.id];
            const selected = draft.packageId === pkg.id;
            return (
              <label key={pkg.id} className={`${choiceClass(selected)} grid gap-4 p-6 md:grid-cols-[1fr_auto] md:p-7`}>
                <input
                  type="radio"
                  name="packageId"
                  id={pkg.id === "starter" ? "packageId" : undefined}
                  value={pkg.id}
                  checked={selected}
                  onChange={() => onSelect(pkg.id)}
                  className="sr-only"
                />
                <span>
                  <span className="flex flex-wrap items-center gap-3">
                    <SelectedDot selected={selected} />
                    <span className="text-[1.25rem] font-medium tracking-[-0.03em]">{copy.name}</span>
                    {pkg.featured && (
                      <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[12px] text-sage-deep">
                        {m.common.mostChosen}
                      </span>
                    )}
                  </span>
                  <span className="mt-3 block max-w-lg ps-8 text-[14.5px] leading-relaxed text-muted">{copy.tagline}</span>
                  <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 ps-8 text-[13px] text-ink-soft">
                    {copy.features.slice(0, 6).map((f) => (
                      <span key={f} className="flex items-center gap-1.5">
                        <Check size={12} className="text-sage-deep" /> {f}
                      </span>
                    ))}
                    {copy.features.length > 6 && (
                      <span className="text-muted">{plur(locale, c.more, copy.features.length - 6)}</span>
                    )}
                  </span>
                </span>
                <span className="ps-8 md:ps-0 md:text-end">
                  <span className="block text-[2rem] font-medium leading-none tracking-[-0.04em]">
                    {formatPrice(locale, pkg.price)}
                  </span>
                  <span className="mt-2 block text-[13px] text-muted">{copy.timeline}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {errors.packageId && (
        <p id="packageId-error" className="field-error mt-4">
          {errors.packageId}
        </p>
      )}
      <p className="mt-6 text-sm text-muted">
        {c.notSure}{" "}
        <LocaleLink href="/pricing#compare" className="text-ink underline underline-offset-4" target="_blank">
          {c.compareLink}
          <span className="sr-only"> {m.common.opensInNewTab}</span>
        </LocaleLink>
      </p>
    </>
  );
}

/* -------------------------------------------------------------- Configure */

export function ConfigureStep({ draft, update, errors }: StepProps) {
  const { locale, m } = useI18n();
  const c = m.configurator.configure;
  const pkg = getPackage(draft.packageId);
  const [newPage, setNewPage] = useState("");
  const limit = pkg?.pageLimit ?? 0;
  const extra = Math.max(0, draft.pages.length - limit);
  const suggestions = PAGE_SUGGESTIONS.map((k) => m.pageNames[k]).filter(
    (name) => !draft.pages.some((p) => p.toLowerCase() === name.toLowerCase()),
  );

  const addPage = (name: string) => {
    const clean = name.trim().slice(0, 60);
    if (!clean || draft.pages.some((p) => p.toLowerCase() === clean.toLowerCase()) || draft.pages.length >= 32) return;
    update({ pages: [...draft.pages, clean] });
    setNewPage("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPage(newPage);
    }
  };

  return (
    <>
      <StepHeader step={useStepLabel("configure")} title={c.title} description={c.description} />

      <fieldset aria-describedby={errors.style ? "style-error" : undefined}>
        <legend className="field-label mb-3">{c.styleLegend}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {STYLE_IDS.map((id, i) => {
            const selected = draft.style === id;
            return (
              <label key={id} className={`${choiceClass(selected)} overflow-hidden`}>
                <input
                  type="radio"
                  name="style"
                  id={i === 0 ? "style" : undefined}
                  value={id}
                  checked={selected}
                  onChange={() => update({ style: id })}
                  className="sr-only"
                />
                <StyleSwatch index={i} />
                <span className="flex items-start justify-between gap-3 p-4">
                  <span>
                    <span className="block font-medium tracking-[-0.02em]">{m.styles[id].name}</span>
                    <span className="mt-1 block text-[13.5px] text-muted">{m.styles[id].description}</span>
                  </span>
                  <SelectedDot selected={selected} />
                </span>
              </label>
            );
          })}
        </div>
        {errors.style && (
          <p id="style-error" className="field-error">
            {errors.style}
          </p>
        )}
      </fieldset>

      <fieldset className="mt-12" aria-describedby={`pages-count${errors.pages ? " pages-error" : ""}`}>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <legend className="field-label mb-0">{c.pagesLegend}</legend>
          <span id="pages-count" className={`text-[13px] ${extra ? "text-ink" : "text-muted"}`}>
            {fmt(c.pagesCount, { count: draft.pages.length, limit })}
            {extra > 0 && ` · ${fmt(c.extraPages, { count: extra, price: formatPrice(locale, EXTRA_PAGE_PRICE) })}`}
          </span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {draft.pages.map((p, i) => (
            <li
              key={p}
              className={`flex items-center gap-1 rounded-full border bg-surface py-1 pe-1 ps-3.5 text-[14px] ${
                i >= limit ? "border-dashed border-ink" : "border-line-strong"
              }`}
            >
              {p}
              <button
                type="button"
                onClick={() => update({ pages: draft.pages.filter((x) => x !== p) })}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label={fmt(c.remove, { page: p })}
              >
                <Close size={12} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <label htmlFor="pages" className="sr-only">
            {c.newPageLabel}
          </label>
          <input
            id="pages"
            className="field-input"
            placeholder={c.newPagePlaceholder}
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            onKeyDown={onKey}
            maxLength={60}
            autoComplete="off"
          />
          <button type="button" className="btn btn-secondary h-12 shrink-0" onClick={() => addPage(newPage)}>
            {c.add}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-3">
            <p className="sr-only">{c.suggestions}</p>
            <ul className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 8).map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => addPage(s)}
                    aria-label={fmt(c.addSuggestion, { page: s })}
                    className="min-h-9 rounded-full px-2.5 text-[13px] text-muted hover:bg-surface hover:text-ink"
                  >
                    + {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {errors.pages && (
          <p id="pages-error" className="field-error">
            {errors.pages}
          </p>
        )}
      </fieldset>

      <div className="mt-12">
        <TextField
          id="colorNotes"
          label={c.colorLabel}
          optional
          placeholder={c.colorPlaceholder}
          value={draft.colorNotes}
          onChange={(e) => update({ colorNotes: e.target.value })}
          maxLength={300}
          error={errors.colorNotes}
        />
      </div>
    </>
  );
}

function StyleSwatch({ index }: { index: number }) {
  const swatches = [
    <span key="m" className="flex h-full flex-col justify-between bg-[#fafaf8] p-4">
      <span className="block h-1.5 w-10 rounded bg-[#111]" />
      <span className="block space-y-1.5">
        <span className="block h-3 w-3/4 rounded-sm bg-[#111]" />
        <span className="block h-1.5 w-1/2 rounded bg-[#ccc]" />
      </span>
    </span>,
    <span key="e" className="grid h-full grid-cols-[1.2fr_1fr] gap-3 bg-[#f3eee7] p-4">
      <span className="block space-y-1.5 self-end">
        <span className="block font-[family-name:var(--font-instrument)] text-[22px] leading-none text-[#2a2420]">Aa</span>
        <span className="block h-1.5 w-full rounded bg-[#2a2420]/30" />
      </span>
      <span className="block rounded-sm bg-[#d8c6b4]" />
    </span>,
    <span key="w" className="flex h-full items-end gap-2 bg-[#efe6da] p-4">
      <span className="block h-12 w-12 rounded-full bg-[#c99a7d]" />
      <span className="block h-8 w-8 rounded-full bg-[#8e9a7c]" />
      <span className="ms-auto block h-2 w-12 rounded-full bg-[#5a4636]/40" />
    </span>,
    <span key="b" className="flex h-full flex-col justify-end bg-[#111] p-4" dir="ltr">
      <span className="block text-[26px] font-semibold leading-none tracking-[-0.05em] text-[#f7f6f2]">BOLD</span>
      <span className="mt-2 block h-1.5 w-1/3 rounded bg-[#c8ff5a]/80" />
    </span>,
  ];
  return (
    <span className="block h-24" aria-hidden>
      {swatches[index]}
    </span>
  );
}

/* ---------------------------------------------------------------- Add-ons */

export function AddOnsStep({ draft, update }: StepProps) {
  const { locale, m } = useI18n();
  const c = m.configurator.addons;
  const stepLabel = useStepLabel("addons");
  const pkg = getPackage(draft.packageId);
  if (!pkg) return null;
  const options = availableAddOns(pkg.id).filter((a) => a.id !== "extra-pages");
  const extraPages = draft.addOns["extra-pages"] ?? 0;

  const toggle = (id: AddOnId, on: boolean) => {
    const next = { ...draft.addOns };
    if (on) next[id] = 1;
    else delete next[id];
    update({ addOns: next });
  };

  return (
    <>
      <StepHeader step={stepLabel} title={c.title} description={fmt(c.description, { package: m.packages[pkg.id].name })} />

      {extraPages > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-dashed border-ink bg-surface p-5">
          <div>
            <p className="font-medium">{plur(locale, c.extraTitle, extraPages)}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              {fmt(c.extraNote, { price: formatPrice(locale, EXTRA_PAGE_PRICE) })}
            </p>
          </div>
          <span className="shrink-0">{formatPrice(locale, EXTRA_PAGE_PRICE * extraPages)}</span>
        </div>
      )}

      <fieldset>
        <legend className="sr-only">{c.legend}</legend>
        <ul className="grid gap-3">
          {options.map((a) => {
            const selected = Boolean(draft.addOns[a.id]);
            return (
              <li key={a.id}>
                <label className={`${choiceClass(selected)} flex items-center gap-4 p-5`}>
                  <input
                    type="checkbox"
                    name="addOns"
                    value={a.id}
                    checked={selected}
                    onChange={(e) => toggle(a.id, e.target.checked)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border transition-colors ${
                      selected ? "border-ink bg-ink text-canvas" : "border-control"
                    }`}
                  >
                    {selected ? <Check size={13} /> : <Plus size={12} className="text-muted" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium tracking-[-0.015em]">{m.addOns[a.id].name}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{m.addOns[a.id].description}</span>
                  </span>
                  <span className="shrink-0 text-[15px]">+{formatPrice(locale, a.price)}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <p className="mt-6 text-sm text-muted">{c.skip}</p>
    </>
  );
}

/* ---------------------------------------------------------------- Details */

export function DetailsStep({ draft, update, errors }: StepProps) {
  const { m } = useI18n();
  const c = m.configurator.details;
  const set = (key: keyof Draft) => (e: { target: { value: string } }) => update({ [key]: e.target.value } as Partial<Draft>);
  return (
    <>
      <StepHeader step={useStepLabel("details")} title={c.title} description={c.description} />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="fullName" label={c.fullName} autoComplete="name" maxLength={120} value={draft.fullName} onChange={set("fullName")} error={errors.fullName} />
        <TextField id="email" label={c.email} type="email" inputMode="email" autoComplete="email" spellCheck={false} maxLength={200} value={draft.email} onChange={set("email")} error={errors.email} hint={c.emailHint} />
        <TextField id="phone" label={c.phone} type="tel" inputMode="tel" autoComplete="tel" optional maxLength={40} value={draft.phone} onChange={set("phone")} error={errors.phone} />
        <TextField id="businessName" label={c.businessName} autoComplete="organization" maxLength={160} value={draft.businessName} onChange={set("businessName")} error={errors.businessName} />
        <SelectField id="industry" label={c.industry} value={draft.industry} onChange={set("industry")} error={errors.industry}>
          <option value="" disabled>
            {c.industryPlaceholder}
          </option>
          {INDUSTRY_IDS.map((id) => (
            <option key={id} value={id}>
              {m.industries[id]}
            </option>
          ))}
        </SelectField>
        <TextField id="currentWebsite" label={c.currentWebsite} optional placeholder={c.websitePlaceholder} type="text" inputMode="url" autoComplete="url" spellCheck={false} maxLength={300} value={draft.currentWebsite} onChange={set("currentWebsite")} error={errors.currentWebsite} />
        <div className="sm:col-span-2">
          <TextArea id="goals" label={c.goals} placeholder={c.goalsPlaceholder} hint={c.goalsHint} value={draft.goals} onChange={set("goals")} error={errors.goals} maxLength={2000} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="audience" label={c.audience} optional rows={3} value={draft.audience} onChange={set("audience")} error={errors.audience} maxLength={1000} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="inspiration" label={c.inspiration} optional rows={3} placeholder={c.inspirationPlaceholder} value={draft.inspiration} onChange={set("inspiration")} error={errors.inspiration} maxLength={1000} />
        </div>
        <fieldset>
          <legend className="field-label">{c.hasDomain}</legend>
          <div className="flex gap-2">
            {(["yes", "no", "unsure"] as const).map((v) => (
              <label
                key={v}
                className={`flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border px-2 text-center text-[14px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                  draft.hasDomain === v ? "border-ink bg-ink text-canvas" : "border-control bg-surface hover:border-ink"
                }`}
              >
                <input type="radio" name="hasDomain" value={v} checked={draft.hasDomain === v} onChange={() => update({ hasDomain: v })} className="sr-only" />
                {c.domain[v]}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField id="launchDate" label={c.launchDate} optional type="date" value={draft.launchDate} onChange={set("launchDate")} error={errors.launchDate} />

        {/* Spam trap: hidden from people and assistive technology; bots that fill it are rejected server-side. */}
        <div aria-hidden className="sr-only">
          <label htmlFor="website2">{c.honeypot}</label>
          <input id="website2" name="website2" type="text" tabIndex={-1} autoComplete="off" value={draft.website2} onChange={set("website2")} />
        </div>
      </div>
    </>
  );
}
