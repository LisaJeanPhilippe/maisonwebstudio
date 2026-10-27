import "server-only";

/** Known file signatures. Types not listed here are checked only for disguised HTML/scripts. */
const SIGNATURES: Record<string, (b: Uint8Array) => boolean> = {
  png: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  gif: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  webp: (b) => ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP",
  pdf: (b) => ascii(b, 0, 5) === "%PDF-",
  zip: isZip,
  docx: isZip,
  sketch: isZip,
  fig: (b) => isZip(b) || ascii(b, 0, 8) === "fig-kiwi",
  psd: (b) => ascii(b, 0, 4) === "8BPS",
  doc: (b) => b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0,
};

function ascii(b: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...b.slice(start, end));
}
function isZip(b: Uint8Array) {
  return b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07);
}

/** Executables and markup that should never arrive as a "logo" or "photo". */
function looksDangerous(b: Uint8Array) {
  if (ascii(b, 0, 2) === "MZ") return true; // Windows executable
  if (b[0] === 0x7f && ascii(b, 1, 4) === "ELF") return true;
  const head = new TextDecoder("utf-8", { fatal: false }).decode(b.slice(0, 512)).trimStart().toLowerCase();
  return head.startsWith("<!doctype html") || head.startsWith("<html") || head.startsWith("<script");
}

/**
 * Returns true when the file's first bytes are consistent with its extension.
 * This is a sanity check, not malware scanning — uploaded files are stored
 * privately and served only as downloads.
 */
export function contentMatchesExtension(ext: string, head: Uint8Array): boolean {
  if (head.length === 0) return false;
  if (looksDangerous(head)) return false;
  const check = SIGNATURES[ext];
  return check ? check(head) : true;
}
