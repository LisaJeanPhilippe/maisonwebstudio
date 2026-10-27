import { NextResponse } from "next/server";
import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/uploads";
import { contentMatchesExtension } from "@/lib/server/file-check";
import { clientIp, isSameOrigin, jsonError, rateLimit } from "@/lib/server/request-guards";
import { saveUpload } from "@/lib/server/storage";

/** Multipart overhead allowance on top of the file itself. */
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError(403, "failed");
  if (!(await rateLimit("UPLOAD_LIMITER", clientIp(request), { limit: 30, windowMs: 60_000 }))) {
    return jsonError(429, "rateLimited");
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (!declared || declared > MAX_REQUEST_BYTES) return jsonError(413, "tooLarge");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "failed");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "failed");
  if (file.size > MAX_UPLOAD_BYTES) return jsonError(413, "tooLarge");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) return jsonError(415, "type");
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  if (!contentMatchesExtension(ext, head)) return jsonError(415, "type");

  try {
    const saved = await saveUpload(file);
    return NextResponse.json(saved, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[uploads] Failed to store file:", err instanceof Error ? err.message : "unknown");
    return jsonError(500, "failed");
  }
}
