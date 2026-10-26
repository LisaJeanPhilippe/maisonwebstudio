import type { Metadata } from "next";

export const metadata: Metadata = { title: "Project terms" };

const TERMS = [
  ["Scope", "Your project includes the pages, features and revision rounds listed in your package and any add-ons purchased. Additional work beyond this scope is quoted separately before it begins."],
  ["Payment", "Every project is paid in full at checkout. All payments are final and non-refundable, as set out in our payment agreement."],
  ["Timeline", "Timelines are estimates that begin once we’ve received your content and completed the kickoff call. Delays in receiving content or feedback may shift your launch date."],
  ["Revisions", "Each package includes a set number of revision rounds. A round is a consolidated set of feedback on the current design or build."],
  ["Content & assets", "You confirm you have the right to use any logos, images and text you provide. We may recommend licensed imagery where needed."],
  ["Ownership", "Once your project is paid in full, you own the final design and content of your website. We may show the finished work in our portfolio unless you ask us not to."],
  ["Hosting & third-party services", "Domain, hosting and third-party tools (such as booking or email platforms) are billed by those providers and are subject to their own terms."],
];

export default function TermsPage() {
  return (
    <section className="container-page pb-28 pt-16 md:pt-28">
      <p className="eyebrow mb-8">Legal</p>
      <h1 className="text-headline font-medium">Project terms</h1>
      <p className="mt-6 max-w-2xl text-lede text-muted">
        The plain-language basics of working together. Questions? Email hello@masionwebstudio.com.
      </p>
      <dl className="mt-16 max-w-3xl border-t border-line">
        {TERMS.map(([t, d]) => (
          <div key={t} className="grid gap-3 border-b border-line py-8 md:grid-cols-[200px_1fr] md:gap-10">
            <dt className="font-medium">{t}</dt>
            <dd className="text-[15.5px] leading-relaxed text-muted">{d}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
