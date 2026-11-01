/**
 * Legal page templates generated from what the site actually does (forms, fonts, hosting,
 * linked third-party tools). They are starting points marked for review by the business owner
 * and a legal advisor — never presented as guaranteeing compliance.
 */
export type LegalInput = {
  businessName: string;
  contactEmail: string | null;
  location: string | null;
  hasForms: boolean;
  usesWebFonts: boolean;
  /** Third-party services the site links to (booking, ordering, store). */
  linkedServices: string[];
  updated: string;
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const p = (s: string) => `<p>${esc(s)}</p>`;
const h = (s: string) => `<h2>${esc(s)}</h2>`;
const ul = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`;

export function legalPages(i: LegalInput) {
  const who = i.businessName;
  const contact = i.contactEmail ? `by email at ${i.contactEmail}` : "using the contact details on this website";
  const privacy = [
    p(`This Privacy Policy explains how ${who} ("we", "us") handles personal information collected through this website.`),
    h("Information we collect"),
    i.hasForms
      ? p("When you use a form on this website we receive the information you enter, such as your name, email address, phone number, the details of your request and, for booking requests, your preferred date and time. Form messages are delivered to us by email.")
      : p("This website does not have forms that collect personal information."),
    p("Our hosting provider processes technical information such as your IP address, browser type and the pages you request, to deliver the website and protect it from abuse."),
    p("We do not use analytics, advertising or tracking cookies on this website."),
    h("How we use information"),
    ul(["To respond to your enquiry or request.", "To provide the products or services you ask for.", "To keep the website secure.", "To meet legal obligations."]),
    h("Service providers"),
    ul([
      "Cloudflare — website hosting and security.",
      ...(i.hasForms ? ["Our email provider — delivering form messages to us."] : []),
      ...(i.usesWebFonts ? ["Bunny Fonts — serves the typefaces used on this site (your browser requests fonts from their servers, which process your IP address)."] : []),
      ...i.linkedServices.map((s) => `${s} — if you follow a link to book, order or buy, that service's own privacy policy applies.`),
    ]),
    h("How long we keep information"),
    p("We keep enquiries only as long as needed to respond and for our normal business records, then delete them."),
    h("Your choices and rights"),
    p(`Depending on where you live you may have rights to access, correct or delete your personal information. To make a request, contact us ${contact}.`),
    h("Contact"),
    p(`${who}${i.location ? `, ${i.location}` : ""}. Contact us ${contact}.`),
  ].join("");

  const terms = [
    p(`These terms apply to your use of the ${who} website.`),
    h("Using this website"),
    p("You may use this website for lawful purposes. Don't attempt to disrupt it, gain unauthorized access, or send unsolicited or harmful content through its forms."),
    h("Information on this website"),
    p("We try to keep information such as services, prices and opening hours accurate and up to date, but it may change. Please contact us to confirm details before relying on them."),
    h("Links to other websites"),
    p("This website may link to other services (for example booking or ordering platforms). We are not responsible for their content or practices; their own terms apply."),
    h("Intellectual property"),
    p(`The content and design of this website belong to ${who} or its licensors. Don't copy them without permission.`),
    h("Liability"),
    p("To the extent permitted by law, the website is provided \"as is\" and we are not liable for losses arising from its use."),
    h("Contact"),
    p(`Questions about these terms? Contact us ${contact}.`),
  ].join("");

  const cookies = [
    p("This page explains the cookies and similar browser storage this website uses."),
    h("What we use"),
    ul([
      "No analytics, advertising or tracking cookies.",
      "If you choose a language, your choice is remembered in your browser's local storage so the site opens in that language next time. You can clear it in your browser settings.",
      "Cloudflare, our hosting provider, may set strictly necessary security cookies to protect the site from abuse.",
    ]),
    h("Why there is no cookie banner"),
    p("Because this website only uses storage that is strictly necessary or that remembers a choice you made, consent is generally not required for it. If we ever add analytics or other optional tools, we will ask for your consent before they load."),
  ].join("");

  const accessibility = [
    p(`${who} wants everyone to be able to use this website. We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA.`),
    h("What we have done"),
    ul([
      "Clear headings, page landmarks and a link to skip to the main content.",
      "Keyboard access to all menus, links and forms, with visible focus.",
      "Text and buttons checked for color contrast.",
      "Form fields with labels and clear error messages.",
      "Images described with alternative text.",
      "Layouts that adapt to phones, tablets and zoom, including right-to-left languages.",
      "Respect for the reduce-motion setting.",
    ]),
    h("Known limitations"),
    p("Some third-party services we link to (for example booking or ordering platforms) are run by other companies and may not meet the same standard. Translations may contain mistakes."),
    h("Feedback"),
    p(`If you have difficulty using any part of this website, contact us ${contact} and we will help and work to fix the problem.`),
    p("This statement reflects automated and manual checks; the website has not been independently audited, so we do not claim full conformance."),
  ].join("");

  return [
    { slug: "privacy", title: "Privacy Policy", updated: i.updated, html: privacy },
    { slug: "terms", title: "Terms & Conditions", updated: i.updated, html: terms },
    { slug: "cookies", title: "Cookie Policy", updated: i.updated, html: cookies },
    { slug: "accessibility", title: "Accessibility Statement", updated: i.updated, html: accessibility },
  ];
}
