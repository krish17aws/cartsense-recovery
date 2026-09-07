import { desc, eq } from "drizzle-orm";
import { ensureDb, getDb } from "../../../db";
import { recoveryDrafts } from "../../../db/schema";

export async function GET() {
  await ensureDb();
  const rows = await getDb().select().from(recoveryDrafts).orderBy(desc(recoveryDrafts.updatedAt)).limit(100);
  return Response.json({ drafts: rows });
}

export async function POST(request: Request) {
  await ensureDb();
  const body = await request.json() as Record<string, unknown>;
  const id = String(body.id ?? "").trim(), cartId = String(body.cartId ?? "").trim(), fingerprint = String(body.cartFingerprint ?? "").trim();
  if (!id || !cartId || !fingerprint) return Response.json({ error: "id, cartId and cartFingerprint are required" }, { status: 400 });
  const now = new Date().toISOString();
  const values = { id, cartId, cartFingerprint: fingerprint, customerName: String(body.customerName ?? "Unknown"), intentScore: Number(body.intentScore ?? 0), decision: String(body.decision ?? "CONTACT"), messageText: String(body.messageText ?? ""), status: String(body.status ?? "draft"), geminiCalls: Number(body.geminiCalls ?? 1), createdAt: String(body.createdAt ?? now), updatedAt: now };
  await getDb().insert(recoveryDrafts).values(values).onConflictDoUpdate({ target: recoveryDrafts.id, set: { status: values.status, updatedAt: now, messageText: values.messageText, cartFingerprint: fingerprint } });
  const [saved] = await getDb().select().from(recoveryDrafts).where(eq(recoveryDrafts.id, id)).limit(1);
  return Response.json({ draft: saved }, { status: 201 });
}
