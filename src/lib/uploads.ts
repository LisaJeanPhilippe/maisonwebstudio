/** Upload limits shared by the browser (for early feedback) and the server (authoritative). */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 15;

export const ACCEPTED_EXTENSIONS = [
  "png", "jpg", "jpeg", "webp", "gif", "svg", "heic", "avif",
  "pdf", "doc", "docx", "txt", "rtf", "md",
  "ai", "eps", "psd", "fig", "sketch", "zip",
  "mp4", "mov",
] as const;
