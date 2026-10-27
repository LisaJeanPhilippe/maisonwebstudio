import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // APIs and the order confirmation page are never useful in search results.
        disallow: ["/api/", "/checkout/", "/*/checkout/"],
      },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
