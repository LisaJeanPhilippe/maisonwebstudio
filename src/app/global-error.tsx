"use client";

import "./globals.css";

/** Last-resort error page if the root layout itself fails. Kept dependency-free. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-canvas px-6 text-center text-ink">
        <main>
          <h1 className="text-headline font-medium">Something went wrong.</h1>
          <p className="mt-6 text-lede text-muted">Please try again. If the problem continues, email hello@maisonwebstudio.com.</p>
          <div className="mt-10 flex justify-center gap-3">
            <button type="button" onClick={reset} className="btn btn-primary">Try again</button>
            {/* A full page load is intentional here: the app shell itself failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="btn btn-secondary">Back to home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
