/** Upload limits shared by the browser (for early feedback) and the server (authoritative). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 15;

export const ACCEPTED_EXTENSIONS = [
  "png", "jpg", "jpeg", "webp", "gif", "svg", "heic", "avif",
  "pdf", "doc", "docx", "txt", "rtf", "md",
  "ai", "eps", "psd", "fig", "sketch", "zip",
  "mp4", "mov",
] as const;

/** Stored content type comes from the checked extension, never from the browser-supplied type. */
export const MIME_TYPES: Record<(typeof ACCEPTED_EXTENSIONS)[number], string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  svg: "image/svg+xml", heic: "image/heic", avif: "image/avif",
  pdf: "application/pdf", doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain", rtf: "application/rtf", md: "text/markdown",
  ai: "application/postscript", eps: "application/postscript", psd: "image/vnd.adobe.photoshop",
  fig: "application/octet-stream", sketch: "application/octet-stream", zip: "application/zip",
  mp4: "video/mp4", mov: "video/quicktime",
};

/** Inspiration uploads are design references only: images and PDFs. */
export const INSPIRATION_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif", "pdf"] as const;
