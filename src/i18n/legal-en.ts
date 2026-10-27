/**
 * Contractual wording shown at checkout. Deliberately kept in English for
 * every language (marked lang="en" in the page) until a professional legal
 * translation is reviewed — see docs/TRANSLATION_REVIEW.md.
 */
export const PAYMENT_AGREEMENT_POINTS = [
  "Your order is paid in full today. We don’t offer deposits or payment plans.",
  "All payments are final and non-refundable once your order is placed.",
  "Your payment reserves your place in our schedule, and work begins straight away.",
  "Changes beyond your package and add-ons are quoted and paid for separately.",
];

export const AGREEMENT_CHECKBOX = (amount: string) =>
  `I agree to pay ${amount} in full today and understand that all payments are final and non-refundable.`;

export const TERMS_CHECKBOX = {
  before: "I agree to the ",
  link: "Terms & Conditions",
  after: ", including the revision rounds and timeline for my package.",
};
