/** WCAG contrast helpers used by the renderer (to correct colors) and the quality checks (to verify). */

export function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

export const toHex = (rgb: [number, number, number]) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;

export function luminance(hex: string): number {
  const rgb = parseHex(hex) ?? [0, 0, 0];
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Moves `fg` toward black or white until it reaches `min` contrast on `bg`. */
export function ensureContrast(fg: string, bg: string, min: number): string {
  if (!parseHex(fg)) fg = "#111111";
  if (contrast(fg, bg) >= min) return toHex(parseHex(fg)!);
  const towardDark = luminance(bg) > 0.18;
  const start = parseHex(fg)!;
  const end: [number, number, number] = towardDark ? [0, 0, 0] : [255, 255, 255];
  for (let t = 0.05; t <= 1.0001; t += 0.05) {
    const mixed = start.map((v, i) => v + (end[i] - v) * t) as [number, number, number];
    const hex = toHex(mixed);
    if (contrast(hex, bg) >= min) return hex;
  }
  return towardDark ? "#000000" : "#ffffff";
}

/** Readable text color (black or white) on a background. */
export const onColor = (bg: string) => (contrast("#111111", bg) >= contrast("#ffffff", bg) ? "#111111" : "#ffffff");
