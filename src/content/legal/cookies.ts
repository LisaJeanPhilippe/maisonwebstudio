import { LOCALE_COOKIE } from "@/i18n/config";
import type { LegalDocument } from "./types";

/** DRAFT — reflects the storage this site actually uses. Review if analytics or other tools are added. */
export const cookiePolicy = (): LegalDocument => ({
  intro:
    "This Cookie Policy explains the cookies and similar browser storage this website uses. We only use storage that is strictly necessary for the website to work or that remembers a choice you made. We do not use analytics, advertising or social-media tracking.",
  sections: [
    {
      heading: "What we use",
      body: [
        {
          list: [
            `“${LOCALE_COOKIE}” cookie (first-party, 1 year): remembers the language you choose with the language selector. It is set only when you pick a language.`,
            "“masion:configurator:v2” session storage (first-party): keeps your order details while you fill in the order form, so a refresh or a cancelled payment doesn’t lose your work. It is deleted automatically when you close the browser tab, and you can clear it at any time with “Clear my saved details”.",
            "Stripe (third-party, on checkout.stripe.com only): when you go to checkout, Stripe sets cookies on its own pages that are needed to process payment and prevent fraud. See Stripe’s cookie policy.",
            "Cloudflare (our hosting and security provider): may set strictly necessary security cookies, such as for bot protection, if those protections are enabled.",
          ],
        },
      ],
    },
    {
      heading: "Why there is no cookie banner",
      body: [
        "Because we only use strictly necessary storage and storage that remembers choices you make, consent is generally not required for it under laws such as the EU ePrivacy rules, so we don’t show a consent banner. If we ever add analytics or other non-essential tools, we will ask for your consent before they load.",
      ],
    },
    {
      heading: "Managing cookies",
      body: [
        "You can delete or block cookies in your browser settings. If you block the language cookie, the site will work but won’t remember your language. If you block session storage, the order form will work but won’t keep your progress after a refresh.",
      ],
    },
  ],
});
