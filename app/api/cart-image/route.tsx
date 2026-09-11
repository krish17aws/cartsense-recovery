import { ImageResponse } from "next/og";
/* eslint-disable @next/next/no-img-element -- next/og requires a plain img element for embedded cart thumbnails */
import { eq } from "drizzle-orm";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";
import productImages from "../../../data/product-images.json";

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
    id?: number;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  const shown = items.slice(0, 4).map((item) => ({
      ...item,
      embeddedImage: item.id
        ? productImages[String(item.id) as keyof typeof productImages]
        : undefined,
    }));
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#173d30",
        color: "white",
        padding: "40px 48px",
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
      <div style={{ fontSize: 43, fontWeight: 700, marginTop: 18 }}>
        {`${cart.customerName}'s cart is waiting`}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginTop: 20,
        }}
      >
        {shown.map((item, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "#234f40",
              borderRadius: 12,
              fontSize: 27,
            }}
          >
            {item.embeddedImage && (
              <img
                src={item.embeddedImage}
                width="132"
                height="98"
                style={{objectFit:"contain",background:"#eef5f1",borderRadius:10,marginRight:18}}
                alt=""
              />
            )}
            <span style={{ flex: 1 }}>
              {`${item.name} × ${item.quantity}`}
            </span>
            <strong>
              {`₹${(item.price * item.quantity).toLocaleString("en-IN")}`}
            </strong>
          </div>
        ))}
      </div>
      {items.length > 4 && (
        <div style={{ fontSize: 20, color: "#b8d1c7", marginTop: 14 }}>
          {`+ ${items.length - 4} more products`}
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "auto",
          borderTop: "2px solid #3a6556",
          paddingTop: 15,
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
    {
      width: 1200,
      height: 680,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
