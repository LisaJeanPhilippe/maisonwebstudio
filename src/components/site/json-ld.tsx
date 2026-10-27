import { PACKAGES } from "@/lib/catalog";
import { SITE, siteOrigin } from "@/lib/site";
import { localizePath, LOCALE_META, type Locale } from "@/i18n/config";

/** Renders structured data safely (escapes "<" so content can't break out of the script tag). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/** Describes the studio and its real, purchasable packages. */
export function organizationJsonLd(locale: Locale, description: string) {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.name,
    url: origin + localizePath(locale, "/"),
    logo: `${origin}/icon-512.png`,
    image: `${origin}/og.png`,
    email: SITE.email,
    description,
    inLanguage: LOCALE_META[locale].tag,
    areaServed: "Worldwide",
    priceRange: "$499–$1,499",
    makesOffer: PACKAGES.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.price,
      priceCurrency: "USD",
      url: `${origin}${localizePath(locale, `/start?package=${p.id}`)}`,
    })),
  };
}
