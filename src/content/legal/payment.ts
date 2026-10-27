import { SITE } from "@/lib/site";
import type { LegalDocument } from "./types";

/** DRAFT — the business owner's final-payment policy. Must be reviewed by legal counsel. */
export const paymentPolicy = (): LegalDocument => ({
  intro: "Every project is paid in full at checkout, and all payments are final and non-refundable.",
  sections: [
    {
      heading: "Payment in full",
      body: [
        "Every order is paid in full at checkout. We don’t offer deposits, installments or payment plans. Your project is confirmed once payment is received.",
      ],
    },
    {
      heading: "All payments are final",
      body: [
        "All payments are final and non-refundable. Once your order is placed, we reserve time in our schedule for your project and begin work, so we can’t refund payments, in whole or in part, if you change your mind or cancel.",
        "This does not affect any rights you may have under consumer protection laws that cannot be excluded by agreement, or our commitment to refund you in full if we decline your order.",
      ],
    },
    {
      heading: "Before you pay",
      body: [
        `Please review your package, pages and add-ons carefully on the review step. If you have questions about what’s included, email ${SITE.email} before placing your order.`,
      ],
    },
    {
      heading: "Your content",
      body: [
        "You upload your content (such as your logo, photos and text) as part of placing your order. An order can’t be placed without it.",
      ],
    },
    {
      heading: "Changes and extra work",
      body: [
        "Your payment covers the package, pages, add-ons and revision rounds you selected. Additional pages, features or revision rounds are quoted separately and must be paid in full before that work begins.",
      ],
    },
    {
      heading: "Payment processing",
      body: [
        "Payments are processed securely by Stripe. We never see or store your full card details. Stripe’s receipt is your record of payment.",
      ],
    },
    {
      heading: "Agreement",
      body: [
        "By checking the payment agreement box at checkout and completing payment, you confirm that you’ve read and accept this policy, including that all payments are final. We keep a record of the version and date you accepted it.",
      ],
    },
  ],
});
