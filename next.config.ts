import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const NON_DEFAULT_LOCALES = "zh|es|hi|ar|fr|bn|pt|ru|id";

/**
 * Content Security Policy. Next.js injects small inline scripts for hydration,
 * so script-src needs 'unsafe-inline' unless every page is rendered dynamically
 * with nonces — a trade-off we accept to keep pages static and fast. Every other
 * directive is locked to this origin. Stripe Checkout is a full-page redirect,
 * so no Stripe scripts or frames are loaded here.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS-only for a year. includeSubDomains/preload are left to the owner to opt into.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Cache Components is left off: it isn't reliable on the Cloudflare Workers runtime.
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async headers() {
    const noStore = [
      { key: "Cache-Control", value: "no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
      // The confirmation page URL carries a Stripe session id: never cache it or leak it via Referer.
      { source: "/checkout/:path*", headers: noStore },
      { source: `/:lang(${NON_DEFAULT_LOCALES})/checkout/:path*`, headers: noStore },
    ];
  },

  async redirects() {
    // English lives at unprefixed URLs; /en/... is a duplicate, so redirect it.
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
    ];
  },

  async rewrites() {
    return {
      // Checked after real files and static routes, so /api, /_next and metadata files are untouched.
      afterFiles: [
        { source: "/", destination: "/en" },
        {
          source: `/:path((?!(?:en|${NON_DEFAULT_LOCALES}|api|_next)(?:/|$)).+)`,
          destination: "/en/:path",
        },
      ],
      beforeFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (the R2 bucket) through wrangler.
if (isDev) import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
