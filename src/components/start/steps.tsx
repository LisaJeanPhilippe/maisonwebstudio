"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import {
  INDUSTRIES,
  PACKAGES,
  STYLE_DIRECTIONS,
  availableAddOns,
  formatPrice,
  getPackage,
  type AddOnId,
  type PackageId,
} from "@/lib/catalog";
import { Check, Close, Minus, Plus } from "@/components/ui/icons";
import { PAGE_SUGGESTIONS, type Draft } from "./draft";
import { SelectField, StepHeader, TextArea, TextField } from "./fields";

export type StepProps = {
  draft: Draft;
  update: (patch: Partial<Draft> | ((draft: Draft) => Partial<Draft>)) => void;
  errors: Record<string, string>;
};

/* ---------------------------------------------------------------- Package */

export function PackageStep({ draft, update, errors, onSelect }: StepProps & { onSelect: (id: PackageId) => void }) {
  return (
    <>
      <StepHeader
        step="Step 1 of 6"
        title="Choose your starting point."
        description="Every package includes custom design, mobile responsiveness and launch assistance. You can add more in the next steps."
      />
      <div role="radiogroup" aria-label="Packages" className="grid gap-3">
        {PACKAGES.map((pkg) => {
          const selected = draft.packageId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => {
                update({ packageId: pkg.id });
                onSelect(pkg.id);
              }}
              className={`group relative grid gap-4 rounded-[var(--radius-md)] border bg-surface p-6 text-left transition-[border-color,box-shadow] duration-300 md:grid-cols-[1fr_auto] md:p-7 ${
                selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong"
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full border transition-colors ${
                      selected ? "border-ink bg-ink text-canvas" : "border-line-strong"
                    }`}
                  >
                    {selected && <Check size={12} />}
                  </span>
                  <span className="text-[1.25rem] font-medium tracking-[-0.03em]">{pkg.name}</span>
                  {pkg.highlight && (
                    <span className="rounded-full bg-sage-soft px-2.5 py-0.5 text-[12px] text-sage-deep">{pkg.highlight}</span>
                  )}
                </div>
                <p className="mt-3 max-w-lg pl-8 text-[14.5px] leading-relaxed text-muted">{pkg.tagline}</p>
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 pl-8 text-[13px] text-ink-soft">
                  {pkg.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-center gap-1.5">
                      <Check size={12} className="text-sage" /> {f}
                    </li>
                  ))}
                  {pkg.features.length > 6 && <li className="text-muted">+{pkg.features.length - 6} more</li>}
                </ul>
              </div>
              <div className="pl-8 md:pl-0 md:text-right">
                <p className="text-[2rem] font-medium leading-none tracking-[-0.04em]">{formatPrice(pkg.price)}</p>
                <p className="mt-2 text-[13px] text-muted">{pkg.timeline}</p>
              </div>
            </button>
          );
        })}
      </div>
      {errors.packageId && <p className="field-error mt-4">{errors.packageId}</p>}
      <p className="mt-6 text-sm text-muted">
        Not sure?{" "}
        <Link href="/pricing#compare" className="text-ink underline underline-offset-4" target="_blank">
          Compare packages side by side
        </Link>
        .
      </p>
    </>
  );
}

/* -------------------------------------------------------------- Configure */

export function ConfigureStep({ draft, update, errors }: StepProps) {
  const pkg = getPackage(draft.packageId);
  const [newPage, setNewPage] = useState("");
  const limit = pkg?.pageLimit ?? 0;
  const extra = Math.max(0, draft.pages.length - limit);

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
      <StepHeader
        step="Step 2 of 6"
        title="Shape your website."
        description="Choose a design direction and the pages you need. We’ll refine everything together on your kickoff call."
      />

      <fieldset>
        <legend className="field-label mb-3">Design direction</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {STYLE_DIRECTIONS.map((s, i) => {
            const selected = draft.style === s.id;
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ style: s.id })}
                className={`overflow-hidden rounded-[var(--radius-md)] border bg-surface text-left transition-[border-color,box-shadow] duration-300 ${
                  selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong"
                }`}
              >
                <StyleSwatch index={i} />
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium tracking-[-0.02em]">{s.name}</p>
                    <p className="mt-1 text-[13.5px] text-muted">{s.description}</p>
                  </div>
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      selected ? "border-ink bg-ink text-canvas" : "border-line-strong"
                    }`}
                  >
                    {selected && <Check size={12} />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {errors.style && <p className="field-error">{errors.style}</p>}
      </fieldset>

      <fieldset className="mt-12">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <legend className="field-label mb-0">Pages</legend>
          <span className={`text-[13px] ${extra ? "text-ink" : "text-muted"}`}>
            {draft.pages.length} of {limit} included
            {extra > 0 && ` · ${extra} extra × ${formatPrice(75)}`}
          </span>
        </div>
        <ul className="flex flex-wrap gap-2">
          {draft.pages.map((p, i) => (
            <li
              key={p}
              className={`flex items-center gap-1 rounded-full border py-1.5 pl-3.5 pr-1.5 text-[14px] ${
                i >= limit ? "border-dashed border-ink bg-surface" : "border-line-strong bg-surface"
              }`}
            >
              {p}
              <button
                type="button"
                onClick={() => update({ pages: draft.pages.filter((x) => x !== p) })}
                className="grid h-6 w-6 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink"
                aria-label={`Remove ${p} page`}
              >
                <Close size={12} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <input
            className="field-input"
            placeholder="Add a page, e.g. “Menu”"
            value={newPage}
            onChange={(e) => setNewPage(e.target.value)}
            onKeyDown={onKey}
            aria-label="New page name"
            maxLength={60}
          />
          <button type="button" className="btn btn-secondary h-12 shrink-0" onClick={() => addPage(newPage)}>
            Add
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PAGE_SUGGESTIONS.filter((s) => !draft.pages.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addPage(s)}
                className="rounded-full px-2.5 py-1 text-[13px] text-muted hover:bg-surface hover:text-ink"
              >
                + {s}
              </button>
            ))}
        </div>
        {errors.pages && <p className="field-error">{errors.pages}</p>}
      </fieldset>

      <div className="mt-12">
        <TextField
          id="colorNotes"
          label="Colors or brand notes"
          optional
          placeholder="e.g. Warm neutrals, our logo is deep green"
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
    <div key="m" className="flex h-full flex-col justify-between bg-[#fafaf8] p-4">
      <div className="h-1.5 w-10 rounded bg-[#111]" />
      <div className="space-y-1.5">
        <div className="h-3 w-3/4 rounded-sm bg-[#111]" />
        <div className="h-1.5 w-1/2 rounded bg-[#ccc]" />
      </div>
    </div>,
    <div key="e" className="grid h-full grid-cols-[1.2fr_1fr] gap-3 bg-[#f3eee7] p-4">
      <div className="space-y-1.5 self-end">
        <div className="font-[family-name:var(--font-instrument)] text-[22px] leading-none text-[#2a2420]">Aa</div>
        <div className="h-1.5 w-full rounded bg-[#2a2420]/30" />
      </div>
      <div className="rounded-sm bg-[#d8c6b4]" />
    </div>,
    <div key="w" className="flex h-full items-end gap-2 bg-[#efe6da] p-4">
      <div className="h-12 w-12 rounded-full bg-[#c99a7d]" />
      <div className="h-8 w-8 rounded-full bg-[#8e9a7c]" />
      <div className="ml-auto h-2 w-12 rounded-full bg-[#5a4636]/40" />
    </div>,
    <div key="b" className="flex h-full flex-col justify-end bg-[#111] p-4">
      <div className="text-[26px] font-semibold leading-none tracking-[-0.05em] text-[#f7f6f2]">BOLD</div>
      <div className="mt-2 h-1.5 w-1/3 rounded bg-[#c8ff5a]/80" />
    </div>,
  ];
  return <div className="h-24">{swatches[index]}</div>;
}

/* ---------------------------------------------------------------- Add-ons */

export function AddOnsStep({ draft, update }: StepProps) {
  const pkg = getPackage(draft.packageId);
  if (!pkg) return null;
  const options = availableAddOns(pkg.id).filter((a) => a.id !== "extra-pages");
  const extraPages = draft.addOns["extra-pages"] ?? 0;

  const toggle = (id: AddOnId) => {
    const next = { ...draft.addOns };
    if (next[id]) delete next[id];
    else next[id] = 1;
    update({ addOns: next });
  };

  return (
    <>
      <StepHeader
        step="Step 3 of 6"
        title="Add what you need."
        description={`Optional extras for your ${pkg.name}. Items already included in your package aren’t shown.`}
      />

      {extraPages > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-dashed border-ink bg-surface p-5">
          <div>
            <p className="font-medium">Additional pages × {extraPages}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              Added automatically from your page list ({formatPrice(75)} each).
            </p>
          </div>
          <span className="shrink-0">{formatPrice(75 * extraPages)}</span>
        </div>
      )}

      <ul className="grid gap-3">
        {options.map((a) => {
          const selected = Boolean(draft.addOns[a.id]);
          return (
            <li key={a.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={selected}
                onClick={() => toggle(a.id)}
                className={`flex w-full items-center gap-4 rounded-[var(--radius-md)] border bg-surface p-5 text-left transition-[border-color,box-shadow] duration-300 ${
                  selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-[7px] border transition-colors ${
                    selected ? "border-ink bg-ink text-canvas" : "border-line-strong"
                  }`}
                >
                  {selected ? <Check size={13} /> : <Plus size={12} className="text-subtle" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium tracking-[-0.015em]">{a.name}</span>
                  <span className="mt-0.5 block text-[13.5px] leading-relaxed text-muted">{a.description}</span>
                </span>
                <span className="shrink-0 text-[15px]">+{formatPrice(a.price)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 flex items-center gap-2 text-sm text-muted">
        <Minus size={14} /> You can skip this step — add-ons can also be added later.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- Details */

export function DetailsStep({ draft, update, errors }: StepProps) {
  const set = (key: keyof Draft) => (e: { target: { value: string } }) => update({ [key]: e.target.value } as Partial<Draft>);
  return (
    <>
      <StepHeader
        step="Step 4 of 6"
        title="Tell us about your business."
        description="The more we know, the better your first design will be. This takes about three minutes."
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField id="fullName" label="Full name" autoComplete="name" value={draft.fullName} onChange={set("fullName")} error={errors.fullName} />
        <TextField id="email" label="Email" type="email" autoComplete="email" value={draft.email} onChange={set("email")} error={errors.email} hint="We’ll send your confirmation here." />
        <TextField id="phone" label="Phone" type="tel" autoComplete="tel" optional value={draft.phone} onChange={set("phone")} error={errors.phone} />
        <TextField id="businessName" label="Business name" autoComplete="organization" value={draft.businessName} onChange={set("businessName")} error={errors.businessName} />
        <SelectField id="industry" label="Industry" value={draft.industry} onChange={set("industry")} error={errors.industry}>
          <option value="" disabled>
            Select an industry
          </option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </SelectField>
        <TextField id="currentWebsite" label="Current website" optional placeholder="yourbusiness.com" inputMode="url" value={draft.currentWebsite} onChange={set("currentWebsite")} error={errors.currentWebsite} />
        <div className="sm:col-span-2">
          <TextArea id="goals" label="What should your new website achieve?" placeholder="e.g. Get more online bookings, look more established than competitors, sell our products online…" value={draft.goals} onChange={set("goals")} error={errors.goals} maxLength={2000} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="audience" label="Who are your ideal customers?" optional rows={3} value={draft.audience} onChange={set("audience")} error={errors.audience} maxLength={1000} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="inspiration" label="Websites you admire" optional rows={3} placeholder="Links and what you like about them" value={draft.inspiration} onChange={set("inspiration")} error={errors.inspiration} maxLength={1000} />
        </div>
        <fieldset>
          <legend className="field-label">Do you own a domain?</legend>
          <div className="flex gap-2">
            {(["yes", "no", "unsure"] as const).map((v) => (
              <label
                key={v}
                className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border text-[14px] capitalize transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
                  draft.hasDomain === v ? "border-ink bg-ink text-canvas" : "border-line-strong bg-surface hover:border-ink"
                }`}
              >
                <input type="radio" name="hasDomain" value={v} checked={draft.hasDomain === v} onChange={() => update({ hasDomain: v })} className="sr-only" />
                {v === "unsure" ? "Not sure" : v}
              </label>
            ))}
          </div>
        </fieldset>
        <TextField id="launchDate" label="Ideal launch date" optional type="date" value={draft.launchDate} onChange={set("launchDate")} error={errors.launchDate} />
      </div>
    </>
  );
}
