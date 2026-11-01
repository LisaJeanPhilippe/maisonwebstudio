import { NextResponse } from "next/server";
import { getOrder } from "@/lib/server/storage";
import { internalAuthorized } from "@/lib/server/studio";

/** Studio-only: the authoritative order record (payment status is written only by the Stripe webhook). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!internalAuthorized(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const order = await getOrder((await params).id);
  if (!order) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(order, { headers: { "Cache-Control": "no-store" } });
}
