import type { Child, FC, PropsWithChildren } from "hono/jsx";

export const NAV = [
  ["/admin", "Projects"],
  ["/admin/connections", "Cloudflare"],
  ["/admin/outreach", "Outreach"],
  ["/admin/review", "Email review"],
  ["/admin/leads", "Leads"],
  ["/admin/replies", "Replies"],
  ["/admin/calls", "Call list"],
  ["/admin/discovery", "Discovery"],
  ["/admin/suppression", "Suppression"],
  ["/admin/settings", "Settings"],
  ["/admin/activity", "Activity"],
] as const;

export type PageProps = PropsWithChildren<{
  title: string;
  path: string;
  admin: string;
  flash?: { kind: "good" | "warn" | "bad"; text: string } | null;
  modeBanner?: Child;
}>;

export const Layout: FC<PageProps> = ({ title, path, admin, flash, modeBanner, children }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="robots" content="noindex, nofollow" />
      <title>{`${title} · Maison Studio`}</title>
      <link rel="stylesheet" href="/admin.css" />
    </head>
    <body>
      <a class="skip" href="#main">
        Skip to content
      </a>
      <header class="top">
        <strong>Maison Studio</strong>
        <nav class="main" aria-label="Admin">
          {NAV.map(([href, label]) => (
            <a href={href} aria-current={path === href ? "page" : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <span class="small muted">{admin}</span>
      </header>
      <main id="main">
        {modeBanner}
        {flash && (
          <p class={`banner ${flash.kind}`} role={flash.kind === "bad" ? "alert" : "status"}>
            {flash.text}
          </p>
        )}
        <h1>{title}</h1>
        {children}
      </main>
    </body>
  </html>
);

export const ModeBanner: FC<{ automated: boolean; testMode: boolean; paused: boolean }> = ({ automated, testMode, paused }) => (
  <p class={`banner ${paused ? "bad" : testMode ? "warn" : "good"}`}>
    <strong>{paused ? "Sending paused" : testMode ? "TEST MODE" : "LIVE"}</strong>
    {" · "}
    {automated ? "Automated mode (approved rules send on their own)" : "Review mode — nothing is sent until you approve it"}
    {testMode && !paused ? " · Email can only go to your test addresses." : ""}
  </p>
);

export const Csrf: FC<{ token: string }> = ({ token }) => <input type="hidden" name="_csrf" value={token} />;

export const Badge: FC<{ value: string | null | undefined; kind?: string }> = ({ value, kind }) =>
  value ? <span class={`badge ${kind ?? value}`}>{value.replace(/_/g, " ").toLowerCase()}</span> : <span class="muted">—</span>;

export const Stat: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div class="card stat">
    <div class="n">{value}</div>
    <div class="l">{label}</div>
  </div>
);

export const Field: FC<PropsWithChildren<{ id: string; label: string; hint?: string }>> = ({ id, label, hint, children }) => (
  <div class="field">
    <label for={id}>{label}</label>
    {children}
    {hint && (
      <p class="hint" id={`${id}-hint`}>
        {hint}
      </p>
    )}
  </div>
);

export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }) : "—";

/** Only http(s) URLs become links; anything else (javascript:, data:…) is shown as text. */
export const safeHref = (url: string | null | undefined) => (url && /^https?:\/\//i.test(url) ? url : undefined);
