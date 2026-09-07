import { ImageResponse } from "next/og";
/* eslint-disable @next/next/no-img-element -- Satori renders remote cart thumbnails into the generated PNG */
import { eq } from "drizzle-orm";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";

export async function GET(request: Request) {
  await ensureDb();
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) return new Response("userId required", { status: 400 });
  const [cart] = await getDb()
    .select()
    .from(cartSnapshots)
    .where(eq(cartSnapshots.userId, userId))
    .limit(1);
  if (!cart) return new Response("Cart not found", { status: 404 });
  const items = JSON.parse(cart.itemsJson) as Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  const shown = items.slice(0, 5);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#173d30",
        color: "white",
        padding: "58px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 26, color: "#d8f56f", letterSpacing: 3 }}>
          CARTSENSE RECOVERY
        </div>
        <div style={{ fontSize: 24, color: "#b8d1c7" }}>
          {`${cart.itemCount} items`}
        </div>
      </div>
      <div style={{ fontSize: 48, fontWeight: 700, marginTop: 28 }}>
        {`${cart.customerName}'s cart is waiting`}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 13,
          marginTop: 30,
        }}
      >
        {shown.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "13px 18px",
              background: "#234f40",
              borderRadius: 12,
              fontSize: 24,
            }}
          >
            {item.image && (
              <img
                src={item.image}
                width="76"
                height="58"
                style={{ objectFit: "cover", borderRadius: 8, marginRight: 14 }}
                alt=""
              />
            )}
            <span>
              {`${item.name} × ${item.quantity}`}
            </span>
            <strong>
              {`₹${(item.price * item.quantity).toLocaleString("en-IN")}`}
            </strong>
          </div>
        ))}
      </div>
      {items.length > 5 && (
        <div style={{ fontSize: 20, color: "#b8d1c7", marginTop: 14 }}>
          {`+ ${items.length - 5} more products`}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "auto",
          borderTop: "2px solid #3a6556",
          paddingTop: 24,
        }}
      >
        <span style={{ fontSize: 24, color: "#b8d1c7" }}>
          Complete your purchase
        </span>
        <strong style={{ fontSize: 52, color: "#d8f56f" }}>
          {`₹${cart.cartTotal.toLocaleString("en-IN")}`}
        </strong>
      </div>
    </div>,
    { width: 1200, height: 1200, headers: { "Cache-Control": "no-store" } },
  );
}
