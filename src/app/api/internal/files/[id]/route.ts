import { getUpload } from "@/lib/server/storage";
import { internalAuthorized } from "@/lib/server/studio";

/** Studio-only: a customer's uploaded file, always as a download (never rendered inline). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!internalAuthorized(request)) return Response.json({ error: "forbidden" }, { status: 403 });
  const file = await getUpload((await params).id);
  if (!file) return Response.json({ error: "not found" }, { status: 404 });
  return new Response(file.body, {
    headers: {
      "Content-Type": file.meta.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.meta.name.replace(/["\\]/g, "_")}"`,
      "X-File-Name": encodeURIComponent(file.meta.name),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
