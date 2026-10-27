import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearSavedDraft } from "@/components/start/configurator-loader";
import { Check } from "@/components/ui/icons";
import { getPackage } from "@/lib/catalog";
import { getStripe } from "@/lib/server/stripe";
import { getOrder, orderReference } from "@/lib/server/storage";
import { maskEmail } from "@/lib/server/email";
import { SITE } from "@/lib/site";
import { localizePath, type Locale } from "@/i18n/config";
import { fmt, formatPrice, plur } from "@/i18n/format";
import { getMessages, type Messages } from "@/i18n/messages";
import { pageMetadata } from "@/i18n/metadata";
import { lineItemName } from "@/components/start/line-items";

export async function generateMetadata({ params }: PageProps<"/[lang]/checkout/success">): Promise<Metadata> {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return pageMetadata({ locale, path: "/checkout/success", title: m.meta.success.title, noindex: true });
}

function Notice({ locale, m, title, body, retry = false }: { locale: Locale; m: Messages; title: string; body: string; retry?: boolean }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-headline font-medium">{title}</h1>
      <p className="mt-6 text-lede text-muted">{body}</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {retry && (
          <Link href={localizePath(locale, "/start?step=review")} className="btn btn-primary">
            {m.success.returnToCheckout}
          </Link>
        )}
        <a href={`mailto:${SITE.email}`} className={`btn ${retry ? "btn-secondary" : "btn-primary"}`}>
          {m.success.contact}
        </a>
      </div>
    </div>
  );
}

/**
 * Read-only confirmation. Payment status comes from Stripe (server-side, with
 * our secret key) — this page never marks orders as paid; the verified webhook does.
 */
async function Confirmation({ locale, m, searchParams }: { locale: Locale; m: Messages; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" ? raw : undefined;
  const stripe = getStripe();
  const s = m.success;

  if (!sessionId || !/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(sessionId) || !stripe) {
    return <Notice locale={locale} m={m} title={s.notFoundTitle} body={s.notFoundBody} />;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (err) {
    const missing = (err as { statusCode?: number }).statusCode === 404;
    return missing ? (
      <Notice locale={locale} m={m} title={s.notFoundTitle} body={s.notFoundBody} />
    ) : (
      <Notice locale={locale} m={m} title={s.unavailableTitle} body={s.unavailableBody} />
    );
  }

  if (session.status === "expired") return <Notice locale={locale} m={m} title={s.expiredTitle} body={s.expiredBody} retry />;
  if (session.status === "open") return <Notice locale={locale} m={m} title={s.failedTitle} body={s.failedBody} retry />;
  if (session.payment_status !== "paid") return <Notice locale={locale} m={m} title={s.processingTitle} body={s.processingBody} />;

  const orderId = session.metadata?.orderId;
  const stored = orderId ? await getOrder(orderId) : null;
  // The order must belong to this exact Stripe session.
  if (!stored || (stored.stripeSessionId && stored.stripeSessionId !== session.id)) {
    return <Notice locale={locale} m={m} title={s.notFoundTitle} body={s.notFoundBody} />;
  }

  const { order } = stored;
  const pkg = getPackage(order.packageId)!;
  const copy = m.packages[pkg.id];

  return (
    <>
      <ClearSavedDraft />
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span aria-hidden className="grid h-14 w-14 place-items-center rounded-full bg-ink text-canvas">
            <Check size={22} />
          </span>
          <p className="eyebrow mb-6 mt-10">{fmt(s.eyebrow, { ref: orderReference(stored.id) })}</p>
          <h1 className="text-headline font-medium text-balance">{fmt(s.title, { name: order.fullName.split(" ")[0] })}</h1>
          <p className="mt-6 max-w-xl text-lede text-muted">{fmt(s.emailSent, { email: maskEmail(order.email) })}</p>

          <ol className="mt-12 border-t border-line">
            {s.next.map(({ t, d }, i) => (
              <li key={t} className="grid grid-cols-[48px_1fr] gap-4 border-b border-line py-6">
                <span className="font-mono text-sm text-muted" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-medium">{t}</h2>
                  <p className="mt-1 text-[15px] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href={localizePath(locale, "/")} className="btn btn-primary">
              {m.common.backToHome}
            </Link>
            <Link href={localizePath(locale, "/work")} className="btn btn-secondary">
              {s.explore}
            </Link>
          </div>
        </div>

        <aside className="lg:col-span-5" aria-labelledby="summary-title">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-7">
            <h2 id="summary-title" className="eyebrow">{s.summary}</h2>
            <p className="mt-4 text-[1.375rem] font-medium tracking-[-0.03em]" dir="auto">{order.businessName}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              {copy.name} · {order.addOns.rush ? copy.rushTimeline : copy.timeline}
            </p>
            <ul className="mt-6 space-y-3 border-t border-line pt-6 text-[14px]">
              {stored.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span className="text-ink-soft">{lineItemName(locale, m, i)}</span>
                  <span>{formatPrice(locale, i.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-line pt-6 text-[14px]">
              <div className="flex justify-between gap-4">
                <span className="text-muted">{s.paid}</span>
                <span className="text-[1.25rem] font-medium">{formatPrice(locale, stored.total)}</span>
              </div>
              <p className="text-[13px] text-muted">{s.finalNote}</p>
            </div>
            <div className="mt-6 border-t border-line pt-6 text-[14px]">
              <p className="text-muted">{s.pages}</p>
              <p className="mt-1" dir="auto">{order.pages.join(" · ")}</p>
              <p className="mt-4 text-muted">{s.assets}</p>
              <p className="mt-1">{plur(locale, s.files, order.files.length)}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default async function SuccessPage({ params, searchParams }: PageProps<"/[lang]/checkout/success">) {
  const locale = (await params).lang as Locale;
  const m = await getMessages(locale);
  return (
    <section className="container-page pb-28 pt-16 md:pt-24">
      <Suspense
        fallback={
          <div className="max-w-xl" aria-busy="true">
            <div className="h-14 w-14 animate-pulse rounded-full bg-line" />
            <div className="mt-10 h-12 w-3/4 animate-pulse rounded bg-line" />
            <p className="mt-6 text-muted" role="status">
              {m.success.confirming}
            </p>
          </div>
        }
      >
        <Confirmation locale={locale} m={m} searchParams={searchParams} />
      </Suspense>
    </section>
  );
}
