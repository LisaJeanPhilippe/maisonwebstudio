import type { Metadata } from "next";
import { PAYMENT_AGREEMENT_VERSION } from "@/lib/catalog";

export const metadata: Metadata = { title: "Payment agreement" };

const SECTIONS = [
  [
    "Payment in full",
    "Every order is paid in full at checkout. We don’t offer deposits, installments or payment plans. Your project is confirmed once payment is received.",
  ],
  [
    "All payments are final",
    "All payments are final and non-refundable. Once your order is placed, we reserve time in our schedule for your project and begin work, so we can’t refund payments, in whole or in part, including if you change your mind, cancel, or don’t provide the content needed to finish your site.",
  ],
  [
    "Before you pay",
    "Please review your package, pages and add-ons carefully on the review step. If you have questions about what’s included, email hello@masionwebstudio.com before placing your order.",
  ],
  [
    "Changes and extra work",
    "Your payment covers the package, pages, add-ons and revision rounds you selected. Additional pages, features or revision rounds are quoted separately and must be paid in full before that work begins.",
  ],
  [
    "Delays",
    "Timelines depend on receiving your content and feedback. If a project is paused for more than 60 days while waiting on you, we may close it. Your payment remains non-refundable, and we’ll deliver the work completed so far.",
  ],
  [
    "Payment processing",
    "Payments are processed securely by Stripe. We never see or store your full card details. Stripe’s receipt is your record of payment.",
  ],
  [
    "Agreement",
    "By checking the payment agreement box at checkout and completing payment, you confirm that you’ve read and accept this agreement, including that all payments are final. We keep a record of the date you accepted it.",
  ],
];

export default function PaymentAgreementPage() {
  return (
    <section className="container-page pb-28 pt-16 md:pt-28">
      <p className="eyebrow mb-8">Legal</p>
      <h1 className="text-headline font-medium">Payment agreement</h1>
      <p className="mt-6 max-w-2xl text-lede text-muted">
        Every project is paid in full at checkout, and all payments are final and non-refundable.
      </p>
      <p className="mt-3 text-[13px] text-subtle">Version {PAYMENT_AGREEMENT_VERSION}</p>
      <dl className="mt-16 max-w-3xl border-t border-line">
        {SECTIONS.map(([t, d]) => (
          <div key={t} className="grid gap-3 border-b border-line py-8 md:grid-cols-[200px_1fr] md:gap-10">
            <dt className="font-medium">{t}</dt>
            <dd className="text-[15.5px] leading-relaxed text-muted">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
