import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Pages are prerendered at build time and the site never revalidates them,
// so no incremental cache storage is needed.
export default defineCloudflareConfig({});
