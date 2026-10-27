import { SITE } from "@/lib/site";
import type { LegalDocument } from "./types";

/**
 * DRAFT — must be reviewed by the business owner and qualified legal counsel.
 * Written to match how this website actually works (see docs/PRIVACY_DATA_MAP.md).
 */
export const privacyPolicy = (): LegalDocument => ({
  intro: `This Privacy Policy explains how ${SITE.legalName} (“we”, “us”) collects, uses and protects personal information when you visit this website or order a website project from us.`,
  sections: [
    {
      heading: "Who we are",
      body: [
        `${SITE.legalName} is responsible for the personal information described in this policy. You can contact us about privacy at ${SITE.email}.${SITE.postalAddress ? ` Our postal address is ${SITE.postalAddress}.` : ""}`,
      ],
    },
    {
      heading: "Information we collect",
      body: [
        "When you order a website through our configurator, we collect the information you choose to give us:",
        {
          list: [
            "Contact details: your full name, email address and (optionally) phone number.",
            "Business details: business name, industry, current website, and your goals, audience, inspiration, preferred launch date and whether you own a domain.",
            "Project choices: your package, add-ons, design direction, page list and any brand or asset notes.",
            "Files you upload, such as your logo, photos, text and documents. Please only upload files you have the right to share; they may include information about other people.",
            "A record that you accepted our payment agreement and terms, with the version and date.",
          ],
        },
        "Payment information: payments are processed by Stripe. We never receive or store your full card number or security code. Stripe tells us whether a payment succeeded, the amount and reference numbers.",
        "Technical information: your IP address is used briefly to protect our order and upload forms from abuse (rate limiting), and our hosting provider processes standard request data such as IP address, browser type and the pages requested to deliver and secure the site.",
        "If you email us, we keep that correspondence.",
        "We do not use analytics, advertising or tracking cookies on this website.",
      ],
    },
    {
      heading: "How we use your information",
      body: [
        {
          list: [
            "To process your order, plan and deliver your website, and communicate with you about it.",
            "To take payment and keep financial records.",
            "To send service emails such as your order confirmation.",
            "To keep the website and our forms secure and prevent fraud and abuse.",
            "To meet legal, tax and accounting obligations, and to establish or defend legal claims.",
          ],
        },
        "We do not sell your personal information, and we do not share it for cross-context behavioral advertising.",
      ],
    },
    {
      heading: "Legal bases (EEA, UK and similar laws)",
      body: [
        "Where these laws apply, we rely on: performance of a contract (to provide the project you order); our legitimate interests (keeping the site secure and running our business, balanced against your rights); legal obligations (for example tax records); and your consent where the law requires it.",
      ],
    },
    {
      heading: "Who we share information with",
      body: [
        "We share personal information only with service providers who help us run the website and deliver projects, under contracts that limit how they may use it:",
        {
          list: [
            "Stripe — payment processing (stripe.com/privacy).",
            "Cloudflare — website hosting, security and storage of order records and uploaded files (cloudflare.com/privacypolicy).",
            "Our email provider — delivery of order confirmations and notifications.",
            "Professional advisers such as accountants or lawyers, where needed.",
          ],
        },
        "We may also disclose information if required by law, to protect our rights or others’ safety, or as part of a sale or reorganization of our business.",
      ],
    },
    {
      heading: "International transfers",
      body: [
        "Our service providers may process information in the United States and other countries. Where required, we rely on appropriate safeguards such as standard contractual clauses offered by those providers.",
      ],
    },
    {
      heading: "How long we keep information",
      body: [
        {
          list: [
            "Order and payment records: for as long as needed to deliver your project and then as required for tax and accounting purposes (typically up to 7 years).",
            "Uploaded files: for the duration of your project and up to 12 months after it is completed, unless you ask us to delete them sooner or keep them longer.",
            "Orders that are never paid, and the files uploaded with them: deleted within 90 days.",
            "Order progress saved in your browser: removed automatically when you close the browser tab.",
          ],
        },
      ],
    },
    {
      heading: "How we protect information",
      body: [
        "The website is served only over encrypted HTTPS connections. Order records and uploaded files are stored privately and are not publicly accessible. Access is limited to people who need it to deliver your project. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.",
      ],
    },
    {
      heading: "Your rights and choices",
      body: [
        "Depending on where you live, you may have the right to access, correct, delete or receive a copy of your personal information, to object to or restrict certain processing, and to withdraw consent. California residents have the right to know, delete and correct personal information and not to be discriminated against for exercising these rights; we do not sell or share personal information.",
        `To make a request, email ${SITE.email}. We may need to verify your identity before responding, and we will respond within the time required by applicable law. You can also complain to your local data protection authority.`,
        "Some information, such as records we must keep for tax purposes, may need to be retained even if you ask us to delete it.",
      ],
    },
    {
      heading: "Children",
      body: ["This website and our services are intended for businesses and are not directed to children under 16. We do not knowingly collect their personal information."],
    },
    {
      heading: "Cookies and browser storage",
      body: ["We use only storage that is necessary for the site to work, such as remembering your language. See our Cookie Policy for details."],
    },
    {
      heading: "Changes to this policy",
      body: ["We may update this policy from time to time. We will change the “last updated” date above and, if changes are significant, take reasonable steps to let you know."],
    },
  ],
});
