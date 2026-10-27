"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useI18n } from "@/i18n/client";

type BaseProps = { id: string; label: string; error?: string; hint?: ReactNode; optional?: boolean };

function Wrapper({ id, label, error, hint, optional, children }: BaseProps & { children: ReactNode }) {
  const { m } = useI18n();
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {optional && <span className="font-normal text-muted">{m.common.optional}</span>}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          <span aria-hidden>⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}

/** Links the control to its hint and error so screen readers announce both. */
function describedBy(id: string, error?: string, hint?: ReactNode) {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": ids || undefined,
  } as const;
}

export function TextField({
  id,
  label,
  error,
  hint,
  optional,
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <input id={id} name={id} className="field-input" required={!optional} {...describedBy(id, error, hint)} {...props} />
    </Wrapper>
  );
}

export function TextArea({
  id,
  label,
  error,
  hint,
  optional,
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea id={id} name={id} className="field-input" required={!optional} {...describedBy(id, error, hint)} {...props} />
    </Wrapper>
  );
}

export function SelectField({
  id,
  label,
  error,
  hint,
  optional,
  children,
  ...props
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrapper id={id} label={label} error={error} hint={hint} optional={optional}>
      <div className="relative">
        <select
          id={id}
          name={id}
          className="field-input appearance-none pe-10"
          required={!optional}
          {...describedBy(id, error, hint)}
          {...props}
        >
          {children}
        </select>
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
          focusable="false"
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </Wrapper>
  );
}

/** Step heading. Focus moves here when a new step opens so screen readers announce it. */
export function StepHeader({ step, title, description }: { step: string; title: string; description?: string }) {
  return (
    <header className="mb-10 md:mb-12">
      <p className="eyebrow mb-4">{step}</p>
      <h1
        id="step-title"
        tabIndex={-1}
        className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.04em] text-balance outline-none"
      >
        {title}
      </h1>
      {description && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}

/** Visually selected state for custom-styled native radios/checkboxes. */
export function choiceClass(selected: boolean) {
  return `relative block cursor-pointer rounded-[var(--radius-md)] border bg-surface transition-[border-color,box-shadow] duration-300 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
    selected ? "border-ink shadow-[0_0_0_1px_var(--color-ink)]" : "border-line hover:border-line-strong"
  }`;
}
