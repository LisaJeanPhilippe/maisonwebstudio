/** A complete, valid order body (prices are never part of it — the server computes them). */
export const validOrder = {
  packageId: "starter",
  style: "minimal",
  pages: ["Home", "About", "Contact"],
  addOns: {},
  fullName: "Test Person",
  email: "test@example.com",
  phone: "",
  businessName: "Test Co",
  currentWebsite: "",
  industry: "beauty",
  goals: "Get more bookings online and look established.",
  hasDomain: "yes",
  files: [{ id: "123e4567-e89b-42d3-a456-426614174000", name: "logo.png", size: 100, type: "image/png" }],
  acceptPaymentAgreement: true,
  acceptTerms: true,
};
