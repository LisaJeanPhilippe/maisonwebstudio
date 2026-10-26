import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = { id: string; label: string; error?: string; hint?: ReactNode; optional?: boolean };

function Wrapper({ id, label, error, hint, optional, children }: BaseProps & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {optional && <span className="font-normal text-subtle">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function aria(id: string, error?: string, hint?: ReactNode) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
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
      <input id={id} name={id} className="field-input" {...aria(id, error, hint)} {...props} />
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
      <textarea id={id} name={id} className="field-input" {...aria(id, error, hint)} {...props} />
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
        <select id={id} name={id} className="field-input appearance-none pr-10" {...aria(id, error, hint)} {...props}>
          {children}
        </select>
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>
    </Wrapper>
  );
}

export function StepHeader({ step, title, description }: { step: string; title: string; description?: string }) {
  return (
    <header className="mb-10 md:mb-12">
      <p className="eyebrow mb-4">{step}</p>
      <h1 className="text-[clamp(2rem,1.5rem+2vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.04em] text-balance">
        {title}
      </h1>
      {description && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}
