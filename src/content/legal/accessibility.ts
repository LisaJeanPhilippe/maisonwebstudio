import { SITE } from "@/lib/site";
import type { LegalDocument } from "./types";

/** Review with the business owner. This is a statement of intent, not a certification. */
export const accessibilityStatement = (): LegalDocument => ({
  intro: `${SITE.name} wants everyone to be able to use this website, including people who use assistive technologies. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA.`,
  sections: [
    {
      heading: "What we’ve done",
      body: [
        {
          list: [
            "Semantic page structure with headings, landmarks and a “skip to main content” link.",
            "Full keyboard access with visible focus indicators, including the menu, language selector and order form.",
            "Form fields with visible labels, clear error messages linked to their fields, and an error summary.",
            "Text and controls checked against WCAG color-contrast requirements.",
            "Animations that respect the “reduce motion” setting, and a pause control for moving content.",
            "Layouts that reflow at 400% zoom and on small screens, with support for right-to-left languages.",
            "Automated accessibility testing (axe) of key pages as part of our test suite.",
          ],
        },
      ],
    },
    {
      heading: "Known limitations",
      body: [
        {
          list: [
            "The small website previews in our portfolio are decorative images of sample sites; each has a text description. The full interactive sample sites are demonstrations and have not been tested to the same standard.",
            "Legal documents and some checkout wording are available in English only.",
            "Translations into languages other than English have not yet been reviewed by native speakers.",
            "Payment takes place on Stripe’s hosted checkout page, which is provided and maintained by Stripe.",
          ],
        },
      ],
    },
    {
      heading: "Testing",
      body: [
        "We test with automated tools and manual keyboard checks. Automated tools cannot find every issue, and this website has not yet been independently audited, so we do not claim full conformance.",
      ],
    },
    {
      heading: "Feedback",
      body: [
        `If you have difficulty using any part of this website, or need information in a different format, email ${SITE.email}. Tell us the page and the problem, and we’ll do our best to help and to fix it. We aim to reply within two business days.`,
      ],
    },
  ],
});
