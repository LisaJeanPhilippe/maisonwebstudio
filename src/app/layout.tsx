import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Masion Web Studio — Beautiful websites built for businesses ready to grow",
    template: "%s — Masion Web Studio",
  },
  description:
    "Masion Web Studio creates modern, conversion-focused websites for businesses that want to look as professional online as they do in real life. Fixed pricing from $499.",
  openGraph: {
    title: "Masion Web Studio",
    description: "Professional websites without the agency headache.",
    siteName: "Masion Web Studio",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f6f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontVariables} antialiased`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
