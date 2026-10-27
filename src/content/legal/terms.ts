import { SITE } from "@/lib/site";
import type { LegalDocument } from "./types";

/** DRAFT — must be reviewed by the business owner and qualified legal counsel before use. */
export const termsAndConditions = (): LegalDocument => ({
  intro: `These Terms & Conditions apply when you use this website and when you buy a website project from ${SITE.legalName} (“we”, “us”). By placing an order you agree to these terms and to our Payment & Refund Policy.`,
  sections: [
    {
      heading: "Our services",
      body: [
        "We design and build websites. Each package, and any add-ons you select, includes the pages, features, revision rounds and estimated timeline described on this website at the time you order. Your order summary and confirmation email list what you purchased.",
      ],
    },
    {
      heading: "Placing an order",
      body: [
        "Your order is confirmed when your payment succeeds and we send a confirmation email. We may decline an order — for example, if the project involves unlawful content — in which case we will refund your payment in full.",
      ],
    },
    {
      heading: "Prices and payment",
      body: [
        "Prices are shown and charged in US dollars. Every order is paid in full at checkout through our payment processor, Stripe. We do not offer deposits or payment plans. You are responsible for any taxes, bank or currency-conversion fees charged by your own bank or card issuer.",
        "All payments are final and non-refundable, as described in our Payment & Refund Policy. Nothing in these terms limits any rights you have under consumer protection laws that cannot be excluded by agreement.",
      ],
    },
    {
      heading: "Your content and responsibilities",
      body: [
        {
          list: [
            "You must upload your content (such as your logo, photos and text) as part of your order and provide timely feedback during the project.",
            "You confirm that you own, or have permission to use, everything you provide, and that it does not infringe anyone’s rights or break any law.",
            "You are responsible for the accuracy of the information on your website, and for your business’s own legal requirements, such as your website’s privacy policy.",
          ],
        },
      ],
    },
    {
      heading: "Timelines and revisions",
      body: [
        "Timelines are good-faith estimates. They begin once we have your content and have held the kickoff call, and they may move if feedback or materials arrive late. Each package includes a set number of revision rounds; a round is one consolidated set of feedback on the current design or build.",
      ],
    },
    {
      heading: "Additional work",
      body: [
        "Work beyond your package and add-ons — such as extra pages, features or revision rounds — is quoted separately and must be paid in full before that work begins.",
      ],
    },
    {
      heading: "Ownership and licenses",
      body: [
        "Once your order is paid in full, you own the final design and content we create specifically for your website. Third-party items such as fonts, plugins, stock images or hosting platforms remain subject to their own licenses and terms. We keep ownership of our general tools, templates, code libraries and know-how, and grant you a license to use them as part of your website.",
        "We may show your finished website in our portfolio unless you ask us not to.",
      ],
    },
    {
      heading: "Hosting, domains and third-party services",
      body: [
        "Domains, hosting and third-party tools (for example booking, email or e-commerce platforms) are provided by those companies under their own terms and are billed by them unless stated otherwise. We are not responsible for their availability or changes they make.",
      ],
    },
    {
      heading: "Using this website",
      body: [
        "You agree not to misuse this website, including by:",
        {
          list: [
            "uploading malware or files you have no right to share;",
            "attempting to gain unauthorized access to our systems or other customers’ information;",
            "interfering with the site’s operation, including through automated abuse of our forms; or",
            "using the site for anything unlawful, fraudulent or harmful.",
          ],
        },
        "The sample websites shown on this site are concept work created to demonstrate our design style. They do not represent real client businesses.",
      ],
    },
    {
      heading: "Disclaimers",
      body: [
        "We provide our services with reasonable care and skill. Except as stated in these terms and to the extent permitted by law, we do not guarantee specific business results, search rankings, traffic or revenue, or that websites will be uninterrupted or error-free.",
      ],
    },
    {
      heading: "Limitation of liability",
      body: [
        "To the extent permitted by law, our total liability for any claim relating to an order is limited to the amount you paid for that order, and we are not liable for indirect or consequential losses such as lost profits or data. Nothing in these terms excludes liability that cannot be excluded by law.",
      ],
    },
    {
      heading: "Ending a project",
      body: [
        "We may pause or end work if you seriously breach these terms, for example by providing unlawful content. Sections that by their nature should continue — such as ownership, payment and limitation of liability — continue after a project ends.",
      ],
    },
    {
      heading: "Governing law",
      body: [
        SITE.governingLaw
          ? `These terms are governed by the laws of ${SITE.governingLaw}, without affecting any mandatory consumer protections in the country where you live.`
          : `These terms are governed by the laws of the jurisdiction in which ${SITE.legalName} is established, without affecting any mandatory consumer protections in the country where you live.`,
      ],
    },
    {
      heading: "Changes and contact",
      body: [
        `We may update these terms. The version in force when you place an order applies to that order. Questions? Email ${SITE.email}.`,
      ],
    },
  ],
});
