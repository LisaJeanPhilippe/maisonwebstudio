import { notFound } from "next/navigation";
import { Footer } from "@/components/site/footer";
import { Nav } from "@/components/site/nav";
import { isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export default async function SiteLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const m = await getMessages(lang);
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
      >
        {m.common.skipToContent}
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="pt-[var(--nav-height)] outline-none">
        {children}
      </main>
      <Footer locale={lang} m={m} />
    </>
  );
}
