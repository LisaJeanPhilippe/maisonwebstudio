import { NextResponse } from "next/server";
import { getOrder, listRecentOrderIds } from "@/lib/server/storage";
import { internalAuthorized } from "@/lib/server/studio";

/** Studio-only: recent orders with their status, so missed events can be reconciled. */
export async function GET(request: Request) {
  if (!internalAuthorized(request)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const ids = await listRecentOrderIds(100);
  const orders = [];
  for (const id of ids) {
    const o = await getOrder(id);
    if (o) orders.push({ id: o.id, status: o.status, updatedAt: o.updatedAt });
  }
  return NextResponse.json({ orders }, { headers: { "Cache-Control": "no-store" } });
}
