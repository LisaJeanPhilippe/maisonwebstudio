import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClearSavedDraft } from "@/components/start/configurator-loader";
import { Check } from "@/components/ui/icons";
import { estimatedTimeline, formatPrice, getPackage } from "@/lib/catalog";
import { fulfillCheckoutSession } from "@/lib/server/fulfillment";
import { getStripe } from "@/lib/server/stripe";
import { orderReference } from "@/lib/server/storage";

export const metadata: Metadata = { title: "Order confirmed", robots: { index: false } };

const NEXT_STEPS = [
  ["Kickoff email", "Within one business day we’ll email you to schedule a 30-minute kickoff call."],
  ["Project board", "You’ll get a shared board with your timeline and anything we still need from you."],
  ["First design", "Your homepage design arrives in your inbox — usually within a week."],
];

function Shell({ children }: { children: React.ReactNode }) {
  return <section className="container-page pb-28 pt-16 md:pt-24">{children}</section>;
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-xl">
      <h1 className="text-headline font-medium">{title}</h1>
      <p className="mt-6 text-lede text-muted">{body}</p>
      <div className="mt-10 flex gap-3">
        <Link href="/start?step=review" className="btn btn-primary">Return to checkout</Link>
        <a href="mailto:hello@masionwebstudio.com" className="btn btn-secondary">Contact us</a>
      </div>
    </div>
  );
}

async function Confirmation({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = (await searchParams).session_id;
  const sessionId = typeof raw === "string" ? raw : undefined;
  const stripe = getStripe();

  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !stripe) {
    return <Problem title="We couldn’t find that order." body="If you’ve just paid, check your email for a receipt or get in touch and we’ll sort it out right away." />;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return <Problem title="We couldn’t find that order." body="The payment session could not be found. If you were charged, please contact us with your receipt." />;
  }

  if (session.payment_status !== "paid") {
    return <Problem title="Your payment is processing." body="We’ll email your confirmation as soon as your payment clears. No need to place the order again." />;
  }

  const stored = await fulfillCheckoutSession(session);
  if (!stored) {
    return <Problem title="Payment received." body="Thank you — your payment went through. We’re matching it to your project details and will email you shortly." />;
  }

  const { order } = stored;
  const pkg = getPackage(order.packageId)!;

  return (
    <>
      <ClearSavedDraft />
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-ink text-canvas">
            <Check size={22} />
          </span>
          <p className="eyebrow mb-6 mt-10">Order {orderReference(stored.id)}</p>
          <h1 className="text-headline font-medium text-balance">
            Thank you, {order.fullName.split(" ")[0]}. Your website is officially underway.
          </h1>
          <p className="mt-6 max-w-xl text-lede text-muted">
            A confirmation has been sent to <span className="text-ink">{order.email}</span>. Here’s what happens next.
          </p>

          <ol className="mt-12 border-t border-line">
            {NEXT_STEPS.map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[48px_1fr] gap-4 border-b border-line py-6">
                <span className="font-mono text-sm text-subtle">0{i + 1}</span>
                <div>
                  <p className="font-medium">{t}</p>
                  <p className="mt-1 text-[15px] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="btn btn-primary">Back to home</Link>
            <Link href="/work" className="btn btn-secondary">Explore our work</Link>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-7">
            <p className="eyebrow">Order summary</p>
            <p className="mt-4 text-[1.375rem] font-medium tracking-[-0.03em]">{order.businessName}</p>
            <p className="mt-1 text-[13.5px] text-muted">
              {pkg.name} · {estimatedTimeline(pkg.id, Boolean(order.addOns.rush))}
            </p>
            <ul className="mt-6 space-y-3 border-t border-line pt-6 text-[14px]">
              {stored.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4">
                  <span className="text-ink-soft">{i.name}</span>
                  <span>{formatPrice(i.total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-2 border-t border-line pt-6 text-[14px]">
              <div className="flex justify-between">
                <span className="text-muted">Total</span>
                <span className="text-[1.25rem] font-medium">{formatPrice(stored.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Paid today</span>
                <span>{formatPrice(stored.dueToday)}</span>
              </div>
              {stored.balance > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Due at launch</span>
                  <span>{formatPrice(stored.balance)}</span>
                </div>
              )}
            </div>
            <div className="mt-6 border-t border-line pt-6 text-[14px]">
              <p className="text-muted">Pages</p>
              <p className="mt-1">{order.pages.join(" · ")}</p>
              {order.files.length > 0 && (
                <>
                  <p className="mt-4 text-muted">Assets received</p>
                  <p className="mt-1">{order.files.length} file{order.files.length > 1 ? "s" : ""}</p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function SuccessPage(props: PageProps<"/checkout/success">) {
  return (
    <Shell>
      <Suspense
        fallback={
          <div className="max-w-xl" aria-busy="true">
            <div className="h-14 w-14 animate-pulse rounded-full bg-line" />
            <div className="mt-10 h-12 w-3/4 animate-pulse rounded bg-line" />
            <p className="mt-6 text-muted">Confirming your payment…</p>
          </div>
        }
      >
        <Confirmation searchParams={props.searchParams} />
      </Suspense>
    </Shell>
  );
}
