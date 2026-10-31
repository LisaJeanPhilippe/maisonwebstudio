/**
 * Reads publicly visible characteristics of a homepage. Pure function of the HTML,
 * so every finding can be shown as evidence and re-checked by a person.
 */

export type SiteSignals = {
  title: string | null;
  lang: string | null;
  viewport: boolean;
  telLinks: number;
  emails: string[];
  contactForm: boolean;
  contactPageUrl: string | null;
  booking: string[];      // vendors/keywords detected
  ordering: string[];
  shop: string[];
  socials: string[];
  copyrightYear: number | null;
  generator: string | null;
  legacyTech: string[];   // frames, flash, table layout…
  imagesWithoutAlt: number;
  images: number;
  callsToAction: string[];
  parked: boolean;
  wordCount: number;
};

const VENDORS: { key: "booking" | "ordering" | "shop"; name: string; re: RegExp }[] = [
  { key: "booking", name: "Vagaro", re: /vagaro\.com/i },
  { key: "booking", name: "Booksy", re: /booksy\.com/i },
  { key: "booking", name: "Square Appointments", re: /squareup\.com\/appointments|square\.site\/book|book\.squareup/i },
  { key: "booking", name: "Fresha", re: /fresha\.com/i },
  { key: "booking", name: "StyleSeat", re: /styleseat\.com/i },
  { key: "booking", name: "GlossGenius", re: /glossgenius\.com/i },
  { key: "booking", name: "Schedulicity", re: /schedulicity\.com/i },
  { key: "booking", name: "Mindbody", re: /mindbodyonline\.com|mindbody\.io/i },
  { key: "booking", name: "Acuity", re: /acuityscheduling\.com|as\.me\//i },
  { key: "booking", name: "Calendly", re: /calendly\.com/i },
  { key: "booking", name: "OpenTable", re: /opentable\.com/i },
  { key: "booking", name: "Resy", re: /resy\.com/i },
  { key: "booking", name: "Tock", re: /exploretock\.com/i },
  { key: "booking", name: "HoneyBook", re: /honeybook\.com/i },
  { key: "booking", name: "Jobber", re: /getjobber\.com|clienthub/i },
  { key: "booking", name: "Housecall Pro", re: /housecallpro\.com/i },
  { key: "ordering", name: "Toast", re: /toasttab\.com/i },
  { key: "ordering", name: "ChowNow", re: /chownow\.com/i },
  { key: "ordering", name: "Square Online ordering", re: /square\.site.*order|squareup\.com\/store/i },
  { key: "ordering", name: "DoorDash", re: /doordash\.com/i },
  { key: "ordering", name: "Uber Eats", re: /ubereats\.com/i },
  { key: "ordering", name: "Grubhub", re: /grubhub\.com/i },
  { key: "ordering", name: "Slice", re: /slicelife\.com/i },
  { key: "ordering", name: "Olo", re: /olo\.com/i },
  { key: "shop", name: "Shopify", re: /cdn\.shopify\.com|myshopify\.com/i },
  { key: "shop", name: "WooCommerce", re: /woocommerce/i },
  { key: "shop", name: "Square Online store", re: /square\.site|squarespace-commerce/i },
  { key: "shop", name: "Etsy", re: /etsy\.com\/shop/i },
  { key: "shop", name: "Stripe checkout", re: /checkout\.stripe\.com|buy\.stripe\.com/i },
];

const BOOKING_WORDS = /\b(book (now|online|an? appointment)|schedule (an? )?(appointment|consultation)|reserve (a )?table|make a reservation|request (a )?(quote|estimate)|get a (free )?quote)\b/i;
const ORDER_WORDS = /\b(order (online|now|pickup|delivery)|start (an? )?order)\b/i;
const SHOP_WORDS = /\b(add to cart|shop now|checkout)\b/i;

const SOCIAL_RE = /https?:\/\/(?:www\.)?(facebook\.com|instagram\.com|tiktok\.com|yelp\.com|x\.com|twitter\.com|youtube\.com|pinterest\.com|linkedin\.com)\/[^\s"'<>)]+/gi;

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ");

export function visibleText(html: string): string {
  return decode(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function analyzeHtml(html: string, pageUrl: string): SiteSignals {
  const lower = html.toLowerCase();
  const text = visibleText(html);
  const attr = (tag: RegExp, name: string) => {
    const m = html.match(tag);
    if (!m) return null;
    const a = m[0].match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
    return a ? decode(a[1]).trim() : null;
  };

  const hrefs = [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => ({
    href: decode(m[1]).trim(),
    label: visibleText(m[2]).slice(0, 80),
  }));

  const emails = new Set<string>();
  for (const h of hrefs) {
    const m = h.href.match(/^mailto:([^?]+)/i);
    if (m) emails.add(decodeURIComponent(m[1]).trim().toLowerCase());
  }
  for (const m of text.matchAll(/[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi)) emails.add(m[0].toLowerCase());
  // Drop image filenames and tracking addresses that look like emails.
  const cleanEmails = [...emails].filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/i.test(e) && !/sentry|wixpress|example\./i.test(e)).slice(0, 5);

  let contactPageUrl: string | null = null;
  const contact = hrefs.find((h) => /contact/i.test(h.href) || /^contact/i.test(h.label));
  if (contact) {
    try {
      const u = new URL(contact.href, pageUrl);
      if (u.origin === new URL(pageUrl).origin) contactPageUrl = u.toString();
    } catch {
      /* ignore */
    }
  }

  const found = (key: "booking" | "ordering" | "shop") => VENDORS.filter((v) => v.key === key && v.re.test(html)).map((v) => v.name);
  const booking = found("booking");
  if (BOOKING_WORDS.test(text)) booking.push("booking/quote call to action");
  const ordering = found("ordering");
  if (ORDER_WORDS.test(text)) ordering.push("online-order call to action");
  const shop = found("shop");
  if (SHOP_WORDS.test(text)) shop.push("cart/checkout");

  const years = [...text.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?((?:19|20)\d{2})/gi)].map((m) => Number(m[1]));
  const legacy: string[] = [];
  if (/<frameset|<frame\b/i.test(html)) legacy.push("frames");
  if (/\.swf\b|application\/x-shockwave-flash/i.test(html)) legacy.push("Flash");
  if (/<marquee|<blink/i.test(html)) legacy.push("obsolete HTML tags");
  if ((lower.match(/<table/g)?.length ?? 0) >= 4 && !/<(main|section|article|nav)\b/i.test(html)) legacy.push("table-based layout");
  if (/<font\b/i.test(html)) legacy.push("<font> tags");

  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const ctas = hrefs
    .map((h) => h.label)
    .filter((l) => /^(book|order|shop|call|contact|get|request|schedule|reserve|buy|start|view menu|menu)\b/i.test(l))
    .slice(0, 8);

  return {
    title: html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ? visibleText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)![1]).slice(0, 140) : null,
    lang: attr(/<html\b[^>]*>/i, "lang"),
    viewport: /<meta[^>]+name\s*=\s*["']viewport["'][^>]*width\s*=\s*device-width/i.test(html) || /<meta[^>]+content\s*=\s*["'][^"']*width\s*=\s*device-width[^>]*name\s*=\s*["']viewport/i.test(html),
    telLinks: hrefs.filter((h) => /^tel:/i.test(h.href)).length,
    emails: cleanEmails,
    contactForm: /<form\b[\s\S]*?(type\s*=\s*["']email["']|<textarea)[\s\S]*?<\/form>/i.test(html),
    contactPageUrl,
    booking: [...new Set(booking)],
    ordering: [...new Set(ordering)],
    shop: [...new Set(shop)],
    socials: [...new Set([...html.matchAll(SOCIAL_RE)].map((m) => m[0].replace(/["')]+$/, "")))].slice(0, 8),
    copyrightYear: years.length ? Math.max(...years) : null,
    generator: attr(/<meta[^>]+name\s*=\s*["']generator["'][^>]*>/i, "content"),
    legacyTech: legacy,
    imagesWithoutAlt: imgs.filter((i) => !/\balt\s*=/i.test(i)).length,
    images: imgs.length,
    callsToAction: ctas,
    parked: /(this domain (is|may be) for sale|buy this domain|domain parking|parked free|is parked|godaddy\.com\/domainsearch|sedoparking|hugedomains)/i.test(html),
    wordCount: text ? text.split(" ").length : 0,
  };
}
