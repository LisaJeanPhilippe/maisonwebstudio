"use client";

import { useEffect } from "react";
import { LocaleLink, useI18n } from "@/i18n/client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { m } = useI18n();
  useEffect(() => {
    // Only the digest is logged; it lets us find the server log entry without exposing details.
    console.error("Page error", error.digest ?? "");
  }, [error]);
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-24 text-center">
      <div className="max-w-xl">
        <h1 className="text-headline font-medium">{m.error.title}</h1>
        <p className="mt-6 text-lede text-muted">{m.error.body}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary">
            {m.error.retry}
          </button>
          <LocaleLink href="/" className="btn btn-secondary">
            {m.common.backToHome}
          </LocaleLink>
        </div>
      </div>
    </section>
  );
}
