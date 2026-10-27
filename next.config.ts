import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is left off: it isn't reliable on the Cloudflare Workers runtime.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Gives `next dev` access to Cloudflare bindings (the R2 bucket) through wrangler.
import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
