import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { MotionProvider } from "@/components/ui/motion-provider";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_META, isLocale } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import { getMessages, pickClientMessages } from "@/i18n/messages";
import { fontVariables } from "@/lib/fonts";
import { siteOrigin } from "@/lib/site";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: "Masion Web Studio", template: "%s | Masion Web Studio" },
  applicationName: "Masion Web Studio",
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
  colorScheme: "light",
};

/**
 * On English (unprefixed) pages, send visitors who previously picked another
 * language to that version. Runs before paint to avoid a flash of English.
 */
const preferenceScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=([a-z]{2})/);var l=m&&m[1];var ok=${JSON.stringify(
  LOCALES.filter((l) => l !== DEFAULT_LOCALE),
)};if(l&&ok.indexOf(l)>-1){var p=location.pathname;location.replace("/"+l+(p==="/"?"":p)+location.search+location.hash);}}catch(e){}})();`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const messages = await getMessages(lang);
  const meta = LOCALE_META[lang];

  return (
    <html lang={meta.tag} dir={meta.dir} className={`${fontVariables} antialiased`} suppressHydrationWarning>
      <head>
        {lang === DEFAULT_LOCALE && <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />}
      </head>
      <body className="min-h-dvh">
        <I18nProvider locale={lang} messages={pickClientMessages(messages)}>
          <MotionProvider>{children}</MotionProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
