import { NextResponse } from "next/server";
import { saveUpload } from "@/lib/server/storage";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "svg", "heic", "avif",
  "pdf", "doc", "docx", "txt", "rtf", "md",
  "ai", "eps", "psd", "fig", "sketch", "zip",
  "mp4", "mov",
]);

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Files must be 15 MB or smaller." }, { status: 413 });
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `.${ext || "?"} files aren't supported.` }, { status: 415 });
  }

  try {
    const saved = await saveUpload(file);
    return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("[uploads] Failed to store file", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
