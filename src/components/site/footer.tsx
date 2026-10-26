import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";
import { ArrowUpRight } from "@/components/ui/icons";

const COLUMNS = [
  {
    title: "Studio",
    links: [
      { href: "/work", label: "Selected work" },
      { href: "/services", label: "Services" },
      { href: "/process", label: "Process" },
      { href: "/about", label: "About" },
    ],
  },
  {
    title: "Start",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#compare", label: "Compare packages" },
      { href: "/start", label: "Configure your website" },
      { href: "/pricing#faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page pb-10 pt-20 md:pt-28">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="text-title font-medium max-w-md text-balance">
              Beautiful websites built for businesses ready to grow.
            </p>
            <Link
              href="/start"
              className="group mt-8 inline-flex items-center gap-2 text-[15px] font-medium"
            >
              <span className="link-underline">Start your website</span>
              <ArrowUpRight className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="eyebrow mb-5">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[15px] text-ink-soft hover:text-ink link-underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-2">
            <p className="eyebrow mb-5">Contact</p>
            <ul className="space-y-3 text-[15px] text-ink-soft">
              <li>
                <a href="mailto:hello@masionwebstudio.com" className="link-underline hover:text-ink">
                  hello@masionwebstudio.com
                </a>
              </li>
              <li>Mon–Fri, 9–6 ET</li>
              <li>Remote · Worldwide</li>
            </ul>
          </div>
        </div>

        <div className="mt-24 flex items-end justify-between gap-6 overflow-hidden">
          <p
            aria-hidden
            className="select-none text-[clamp(4rem,17vw,15rem)] font-medium leading-[0.8] tracking-[-0.06em] text-ink/[0.06]"
          >
            Masion
          </p>
          <LogoMark className="mb-2 hidden h-10 w-10 shrink-0 text-ink md:block" />
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-muted sm:flex-row sm:justify-between">
          <p>© Masion Web Studio. All rights reserved.</p>
          <p>Professional websites without the agency headache.</p>
        </div>
      </div>
    </footer>
  );
}
