import { eq } from "drizzle-orm";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";

type Evidence = {
  label: string;
  detail: string;
  score: number;
  maxScore: number;
  sentiment: "positive" | "neutral" | "risk";
};
type Analysis = {
  recommendation: string;
  couponPercent: number;
  discountAmount: number;
  couponCode: string;
  confidence: number;
  reasoning: string;
  risk: string;
  requiresApproval: boolean;
  activityStatus: string;
  historySummary: string;
  evidence: Evidence[];
};

export async function POST(request: Request) {
  await ensureDb();
  const { userId } = (await request.json()) as { userId?: string };
  if (!userId)
    return Response.json({ error: "userId required" }, { status: 400 });
  const db = getDb();
  const [cart] = await db
    .select()
    .from(cartSnapshots)
    .where(eq(cartSnapshots.userId, userId))
    .limit(1);
  if (!cart) return Response.json({ error: "cart not found" }, { status: 404 });
  if (cart.itemCount === 0)
    return Response.json({ error: "cart is empty" }, { status: 400 });
  const isNew = cart.previousOrders === 0,
    welcomeEligible = isNew && cart.cartTotal > 500;
  const customerHistory: Record<string, {lastPurchaseDays:number; visits30d:number; averageOrderValue:number; priorRecoveries:number}> = {
    rahul: { lastPurchaseDays: 18, visits30d: 7, averageOrderValue: 3450, priorRecoveries: 2 },
    meera: { lastPurchaseDays: 9, visits30d: 11, averageOrderValue: 3890, priorRecoveries: 3 },
    arjun: { lastPurchaseDays: 31, visits30d: 4, averageOrderValue: 2410, priorRecoveries: 1 },
    vikram: { lastPurchaseDays: 14, visits30d: 8, averageOrderValue: 3120, priorRecoveries: 2 },
    sneha: { lastPurchaseDays: 25, visits30d: 5, averageOrderValue: 2760, priorRecoveries: 1 },
  };
  const history = customerHistory[cart.userId] ?? null;
  const evidence: Evidence[] = isNew
    ? [
        {
          label: "Customer history",
          detail: "No previous completed orders",
          score: 12,
          maxScore: 20,
          sentiment: "neutral",
        },
        {
          label: "Cart intent",
          detail: `${cart.itemCount} items worth ₹${cart.cartTotal.toLocaleString("en-IN")}`,
          score: 22,
          maxScore: 25,
          sentiment: "positive",
        },
        {
          label: "Welcome eligibility",
          detail: welcomeEligible
            ? "Cart is above the ₹500 threshold"
            : "Cart does not exceed ₹500",
          score: welcomeEligible ? 25 : 8,
          maxScore: 25,
          sentiment: welcomeEligible ? "positive" : "neutral",
        },
        {
          label: "Inactivity",
          detail: "Recovery timing threshold reached",
          score: 20,
          maxScore: 20,
          sentiment: "positive",
        },
      ]
    : [
        {
          label: "Recent activity",
          detail: history
            ? `${history.visits30d} visits in 30 days; purchased ${history.lastPurchaseDays} days ago`
            : "Returning in the recent activity window",
          score: 18,
          maxScore: 25,
          sentiment: "positive",
        },
        {
          label: "Purchase history",
          detail: `${cart.previousOrders} completed orders${history ? `; average order ₹${history.averageOrderValue.toLocaleString("en-IN")}` : ""}`,
          score: 17,
          maxScore: 20,
          sentiment: "positive",
        },
        {
          label: "Current cart intent",
          detail: `${cart.itemCount} items worth ₹${cart.cartTotal.toLocaleString("en-IN")}`,
          score: 22,
          maxScore: 25,
          sentiment: "positive",
        },
        {
          label: "Recovery response",
          detail: history
            ? `${history.priorRecoveries} earlier recovery purchases`
            : "Limited recovery history",
          score: 14,
          maxScore: 15,
          sentiment: "positive",
        },
        {
          label: "Margin exposure",
          detail:
            cart.cartTotal >= 7000
              ? "20% creates high discount cost"
              : "Low discount exposure",
          score: 11,
          maxScore: 15,
          sentiment: cart.cartTotal >= 7000 ? "risk" : "neutral",
        },
      ];
  const confidence = evidence.reduce((sum, item) => sum + item.score, 0);
  const fallback: Analysis = {
    recommendation: welcomeEligible
      ? "SEND_WELCOME_100"
      : isNew
        ? "SEND_REMINDER_NO_DISCOUNT"
        : cart.cartTotal >= 7000
          ? "OFFER_20_REVIEW"
          : "SEND_REMINDER",
    couponPercent: cart.cartTotal >= 7000 && !isNew ? 20 : 0,
    discountAmount: welcomeEligible ? 100 : 0,
    couponCode: welcomeEligible
      ? "WELCOME100"
      : cart.cartTotal >= 7000 && !isNew
        ? "RECOVER20"
        : "",
    confidence,
    reasoning: welcomeEligible
      ? "This first-purchase cart qualifies for the fixed ₹100 welcome offer."
      : isNew
        ? "This first-purchase cart is below the welcome-offer threshold, so send a reminder without a discount."
        : cart.cartTotal >= 7000
          ? `${cart.customerName} is an active returning customer with ${cart.previousOrders} completed orders and strong current intent. The ₹${cart.cartTotal.toLocaleString("en-IN")} cart supports recovery, but 20% has high margin impact and needs approval.`
          : `${cart.customerName} has ${cart.previousOrders} completed orders and enough current intent for a personalised reminder without discounting.`,
    risk:
      cart.cartTotal >= 7000 && !isNew
        ? "High margin impact"
        : "Low margin risk",
    requiresApproval: cart.cartTotal >= 7000 && !isNew,
    activityStatus: isNew
      ? "New customer"
      : history
        ? "Active returning customer"
        : "Returning customer",
    historySummary: isNew
      ? "No purchase history yet"
      : history
        ? `${cart.previousOrders} orders · ${history.visits30d} visits in 30 days · last purchase ${history.lastPurchaseDays} days ago · ${history.priorRecoveries} prior recovery purchases`
        : `${cart.previousOrders} completed orders`,
    evidence,
  };
  let analysis = fallback,
    source = "policy_engine";
  const key = process.env.GEMINI_API_KEY;
  if (key) {
    try {
      const prompt = `Act as an ecommerce recovery decision agent. Return only JSON with recommendation, couponPercent, discountAmount, confidence, reasoning, risk, requiresApproval. Explain the decision using this evidence: ${JSON.stringify(evidence)}. Customer: ${cart.customerName}; segment: ${cart.customerType}; previous orders: ${cart.previousOrders}; cart total INR: ${cart.cartTotal}; items: ${cart.itemsJson}; known demo history: ${JSON.stringify(history)}. Hard policy: new customers receive exactly INR 100 off only when cart total is greater than INR 500; at INR 500 or below they receive no discount. Never replace that fixed welcome amount with a percentage. Any percentage coupon above 15% requires human approval.`;
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash")}:generateContent?key=${encodeURIComponent(key.trim())}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        },
      );
      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          analysis = { ...fallback, ...JSON.parse(text), evidence, confidence };
          source = "gemini";
        }
      } else {
        console.error(`Gemini request failed (${res.status}): ${await res.text()}`);
      }
    } catch (error) {
      console.error("Gemini analysis failed", error);
      source = "policy_engine";
    }
  }
  if (isNew)
    analysis = {
      ...analysis,
      couponPercent: 0,
      discountAmount: welcomeEligible ? 100 : 0,
      requiresApproval: false,
      recommendation: welcomeEligible
        ? "SEND_WELCOME_100"
        : "SEND_REMINDER_NO_DISCOUNT",
      couponCode: welcomeEligible ? "WELCOME100" : "",
    };
  analysis.couponCode = fallback.couponCode;
  await db
    .update(cartSnapshots)
    .set({
      analysisJson: JSON.stringify(analysis),
      analysisSource: source,
      status: analysis.requiresApproval ? "approval_required" : "ready_to_send",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(cartSnapshots.userId, userId));
  return Response.json({ analysis, source });
}
