/**
 * Regenerates favicons and the social preview image in /public from the brand mark.
 * Usage: node scripts/generate-brand-assets.mjs   (requires Playwright's Chromium)
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "public");
const font = await readFile(path.join(root, "node_modules/next/dist/next-devtools/server/font/geist-latin.woff2"));
const fontFace = `@font-face{font-family:Geist;src:url(data:font/woff2;base64,${font.toString("base64")}) format("woff2");font-weight:100 900}`;

const INK = "#111111";
const CANVAS = "#f7f6f2";

/** The arch mark used in the site header. */
export const markSvg = (size, radius = 8) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="${size}" height="${size}">
<rect width="28" height="28" rx="${radius}" fill="${INK}"/>
<path d="M8 20V11.5a6 6 0 0112 0V20" stroke="${CANVAS}" stroke-width="1.8" fill="none"/>
<path d="M14 20v-6" stroke="${CANVAS}" stroke-width="1.8"/></svg>`;

const ogHtml = `<!doctype html><html><head><style>${fontFace}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;background:${CANVAS};font-family:Geist,sans-serif;color:${INK};overflow:hidden;position:relative}
.brand{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:16px;font-size:30px;font-weight:600;letter-spacing:-.02em}
.brand span{font-weight:400;color:#6b6b6b}
h1{position:absolute;left:72px;top:190px;width:640px;font-size:68px;line-height:1;font-weight:500;letter-spacing:-.045em}
p{position:absolute;left:72px;bottom:64px;font-size:24px;color:#4a4a48;letter-spacing:-.01em}
.stage{position:absolute;right:-40px;top:96px;width:470px;height:470px;border-radius:32px;background:#efede7}
.browser{position:absolute;left:44px;top:56px;width:440px;height:330px;border-radius:14px;background:#fff;box-shadow:0 40px 80px -40px rgba(17,17,17,.35);overflow:hidden;border:1px solid rgba(0,0,0,.06)}
.bar{height:30px;background:#f3f2ee;display:flex;gap:6px;align-items:center;padding:0 12px}.bar i{width:9px;height:9px;border-radius:50%;background:rgba(0,0,0,.12)}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:26px;background:#f5eee8;height:300px}
.hero b{display:block;font-size:34px;line-height:1;font-weight:500;letter-spacing:-.03em;color:#3a2e2a}.hero em{color:#b07c62;font-style:italic}
.pill{margin-top:18px;width:110px;height:26px;border-radius:13px;background:#3a2e2a}
.photo{border-radius:14px;background:radial-gradient(120% 90% at 30% 20%,#fbe9df,#efd3c3 45%,#d9b39f)}
.phone{position:absolute;left:330px;top:210px;width:118px;height:236px;border-radius:24px;background:#111;padding:5px}
.phone div{width:100%;height:100%;border-radius:20px;background:#eef0ea;padding:30px 10px}.phone s{display:block;height:10px;border-radius:5px;background:#6e7b63;margin:8px 0;text-decoration:none}
</style></head><body>
<div class="brand">${markSvg(48)}<div>Maison <span>Web Studio</span></div></div>
<h1>Beautiful websites built for businesses ready to grow.</h1>
<p>Custom websites from $499 · Fixed pricing</p>
<div class="stage"><div class="browser"><div class="bar"><i></i><i></i><i></i></div><div class="hero"><div><b>Skin, <em>softly</em> restored.</b><div class="pill"></div></div><div class="photo"></div></div></div>
<div class="phone"><div><s style="width:70%"></s><s style="width:90%"></s><s style="width:50%;background:#2c3328"></s></div></div></div>
</body></html>`;

await mkdir(out, { recursive: true });
await writeFile(path.join(out, "icon.svg"), markSvg(32));

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

async function renderMark(size, file, { padded = false } = {}) {
  // Apple touch / maskable icons get a full-bleed background with the mark inset.
  const inner = padded ? Math.round(size * 0.72) : size;
  const html = padded
    ? `<body style="margin:0;width:${size}px;height:${size}px;background:${INK};display:grid;place-items:center">${markSvg(inner, 0)}</body>`
    : `<body style="margin:0;background:transparent">${markSvg(size)}</body>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html);
  await page.screenshot({ path: path.join(out, file), omitBackground: !padded, clip: { x: 0, y: 0, width: size, height: size } });
}

for (const s of [16, 32, 48]) await renderMark(s, `favicon-${s}.png`);
await renderMark(180, "apple-touch-icon.png", { padded: true });
await renderMark(192, "icon-192.png", { padded: true });
await renderMark(512, "icon-512.png", { padded: true });

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(ogHtml);
await page.screenshot({ path: path.join(out, "og.png") });
await browser.close();
console.log("Brand assets written to /public");
