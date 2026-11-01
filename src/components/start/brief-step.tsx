"use client";

import { CTA_IDS, FEATURE_IDS, type FeatureId } from "@/lib/catalog";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { Check } from "@/components/ui/icons";
import type { Draft } from "./draft";
import { SelectField, StepHeader, TextArea, TextField } from "./fields";
import { useStepLabel, type StepProps } from "./steps";

/** The detailed website questionnaire. Everything here feeds the project brief. */
export function BriefStep({ draft, update, errors }: StepProps) {
  const { m } = useI18n();
  const c = m.brief;
  const set = (key: keyof Draft) => (e: { target: { value: string } }) => update({ [key]: e.target.value } as Partial<Draft>);
  const toggleFeature = (id: FeatureId, on: boolean) =>
    update({ features: on ? [...new Set([...draft.features, id])] : draft.features.filter((f) => f !== id) });
  const toggleLanguage = (l: Locale, on: boolean) => {
    const next = on ? [...new Set([...draft.languages, l])] : draft.languages.filter((x) => x !== l);
    update({ languages: next.length ? LOCALES.filter((x) => next.includes(x)) : ["en"] });
  };
  const area = (key: keyof Draft, label: string, extra: { hint?: string; placeholder?: string; rows?: number; max?: number; required?: boolean } = {}) => (
    <div className="sm:col-span-2">
      <TextArea
        id={key}
        label={label}
        optional={!extra.required}
        hint={extra.hint}
        placeholder={extra.placeholder}
        rows={extra.rows ?? 3}
        maxLength={extra.max ?? 4000}
        value={draft[key] as string}
        onChange={set(key)}
        error={errors[key]}
      />
    </div>
  );

  return (
    <>
      <StepHeader step={useStepLabel("brief")} title={c.title} description={c.description} />

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 text-[1.25rem] font-medium tracking-[-0.02em]">{c.businessLegend}</legend>
        {area("businessDescription", c.businessDescription, { hint: c.businessDescriptionHint, rows: 4, max: 2000, required: true })}
        <TextField id="location" label={c.location} placeholder={c.locationPlaceholder} autoComplete="address-level2" maxLength={160} value={draft.location} onChange={set("location")} error={errors.location} />
        <TextField id="social" label={c.social} optional placeholder={c.socialPlaceholder} maxLength={500} value={draft.social} onChange={set("social")} error={errors.social} />
      </fieldset>

      <fieldset className="mt-12 grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 text-[1.25rem] font-medium tracking-[-0.02em]">{c.goalsLegend}</legend>
        <SelectField id="primaryCta" label={c.primaryCta} value={draft.primaryCta} onChange={set("primaryCta")} error={errors.primaryCta}>
          <option value="" disabled>
            {c.ctaPlaceholder}
          </option>
          {CTA_IDS.map((id) => (
            <option key={id} value={id}>
              {c.cta[id]}
            </option>
          ))}
        </SelectField>
        <TextField id="desiredActions" label={c.desiredActions} optional maxLength={500} value={draft.desiredActions} onChange={set("desiredActions")} error={errors.desiredActions} />
      </fieldset>

      <fieldset className="mt-12 grid gap-6 sm:grid-cols-2">
        <legend className="mb-4 text-[1.25rem] font-medium tracking-[-0.02em]">{c.designLegend}</legend>
        <TextField id="personality" label={c.personality} optional placeholder={c.personalityPlaceholder} maxLength={300} value={draft.personality} onChange={set("personality")} error={errors.personality} />
        <TextField id="colorsAvoid" label={c.colorsAvoid} optional maxLength={200} value={draft.colorsAvoid} onChange={set("colorsAvoid")} error={errors.colorsAvoid} />
        <TextField id="fonts" label={c.fonts} optional maxLength={200} value={draft.fonts} onChange={set("fonts")} error={errors.fonts} />
        {area("dislikes", c.dislikes, { max: 1000 })}
        {area("designNotes", c.designNotes, { max: 2000 })}
      </fieldset>

      <fieldset className="mt-12">
        <legend className="mb-4 text-[1.25rem] font-medium tracking-[-0.02em]">{c.featuresLegend}</legend>
        <ul className="grid gap-2 sm:grid-cols-2">
          {FEATURE_IDS.map((id) => {
            const on = draft.features.includes(id);
            return (
              <li key={id}>
                <CheckRow checked={on} onChange={(v) => toggleFeature(id, v)} label={c.features[id]} name="features" value={id} />
              </li>
            );
          })}
        </ul>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {area("featuresOther", c.featuresOther, { max: 500, rows: 2 })}
          {area("toolLinks", c.toolLinks, { hint: c.toolLinksHint, max: 1000, rows: 2 })}
        </div>
      </fieldset>

      <fieldset className="mt-12 grid gap-6 sm:grid-cols-2">
        <legend className="mb-1 text-[1.25rem] font-medium tracking-[-0.02em]">{c.contentLegend}</legend>
        <p className="text-[14.5px] text-muted sm:col-span-2">{c.contentHint}</p>
        {area("aboutText", c.aboutText, { rows: 4 })}
        {area("servicesText", c.servicesText, { rows: 4 })}
        {area("productsText", c.productsText)}
        {area("pricingText", c.pricingText, { max: 3000 })}
        {area("testimonialsText", c.testimonialsText, { hint: c.testimonialsHint, max: 3000 })}
        {area("faqText", c.faqText, { max: 3000 })}
        {area("contactInfo", c.contactInfo, { placeholder: c.contactInfoPlaceholder, max: 1000, rows: 2 })}
      </fieldset>

      <fieldset className="mt-12" aria-describedby="languages-hint">
        <legend className="mb-1 text-[1.25rem] font-medium tracking-[-0.02em]">{c.languagesLegend}</legend>
        <p id="languages-hint" className="mb-4 text-[14.5px] text-muted">
          {c.languagesHint}
        </p>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <li key={l}>
              <CheckRow checked={draft.languages.includes(l)} onChange={(v) => toggleLanguage(l, v)} label={LOCALE_META[l].name} lang={LOCALE_META[l].tag} name="languages" value={l} />
            </li>
          ))}
        </ul>
      </fieldset>
    </>
  );
}

function CheckRow({ checked, onChange, label, name, value, lang }: { checked: boolean; onChange: (v: boolean) => void; label: string; name: string; value: string; lang?: string }) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border px-4 py-2.5 text-[14.5px] transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
        checked ? "border-ink bg-surface" : "border-control bg-surface/60 hover:border-ink"
      }`}
    >
      <input type="checkbox" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span aria-hidden className={`grid h-5 w-5 shrink-0 place-items-center rounded-[6px] border ${checked ? "border-ink bg-ink text-canvas" : "border-control"}`}>
        {checked && <Check size={12} />}
      </span>
      <span lang={lang}>{label}</span>
    </label>
  );
}
