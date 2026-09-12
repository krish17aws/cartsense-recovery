import { desc, eq } from "drizzle-orm";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";

export async function GET() {
  await ensureDb();
  const rows = await getDb()
    .select()
    .from(cartSnapshots)
    .orderBy(desc(cartSnapshots.updatedAt));
  return Response.json(
    { carts: rows },
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(request: Request) {
  await ensureDb();
  const b = (await request.json()) as Record<string, unknown>;
  const userId = String(b.userId ?? "");
  if (!userId)
    return Response.json({ error: "userId required" }, { status: 400 });
  const itemCount = Number(b.itemCount ?? 0),
    cartTotal = Number(b.cartTotal ?? 0);
  if (
    !Number.isFinite(itemCount) ||
    !Number.isFinite(cartTotal) ||
    itemCount < 0 ||
    cartTotal < 0
  )
    return Response.json({ error: "Invalid cart totals" }, { status: 400 });
  const db = getDb(),
    now = new Date().toISOString(),
    itemsJson = JSON.stringify(b.items ?? []);
  const [existing] = await db
    .select()
    .from(cartSnapshots)
    .where(eq(cartSnapshots.userId, userId))
    .limit(1);
  const cartChanged =
    !existing ||
    existing.itemsJson !== itemsJson ||
    existing.cartTotal !== cartTotal;
  const values = {
    userId,
    customerName: String(b.customerName ?? "Unknown"),
    customerType: String(b.customerType ?? "Customer"),
    previousOrders: Number(b.previousOrders ?? 0),
    itemsJson,
    itemCount,
    cartTotal,
    lastActivityAt: String(b.lastActivityAt ?? now),
    status: String(b.status ?? "active"),
    analysisJson: cartChanged ? null : (existing?.analysisJson ?? null),
    analysisSource: cartChanged ? null : (existing?.analysisSource ?? null),
    updatedAt: now,
  };
  await db
    .insert(cartSnapshots)
    .values(values)
    .onConflictDoUpdate({ target: cartSnapshots.userId, set: values });
  return Response.json({ saved: true, cartChanged });
}

export async function PATCH(request: Request) {
  await ensureDb();
  const body = (await request.json()) as { userId?: string; status?: string };
  const userId = String(body.userId ?? "").trim();
  const status = String(body.status ?? "").trim();
  if (!userId) return Response.json({ error: "userId required" }, { status: 400 });
  if (status !== "recovered")
    return Response.json({ error: "Unsupported cart status" }, { status: 400 });
  const db = getDb();
  const [existing] = await db
    .select()
    .from(cartSnapshots)
    .where(eq(cartSnapshots.userId, userId))
    .limit(1);
  if (!existing) return Response.json({ error: "cart not found" }, { status: 404 });
  if (existing.itemCount <= 0)
    return Response.json({ error: "cart is empty" }, { status: 400 });
  await db
    .update(cartSnapshots)
    .set({ status: "recovered", updatedAt: new Date().toISOString() })
    .where(eq(cartSnapshots.userId, userId));
  return Response.json({ recovered: true, cartTotal: existing.cartTotal });
}
