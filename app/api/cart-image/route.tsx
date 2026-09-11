import { eq } from "drizzle-orm";
import sharp from "sharp";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";
import productImages from "../../../data/product-images.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartItem = {
  id?: number;
  name: string;
  quantity: number;
  price: number;
};

const escapeXml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export async function GET(request: Request) {
  try {
    await ensureDb();
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return new Response("userId required", { status: 400 });

    const [cart] = await getDb()
      .select()
      .from(cartSnapshots)
      .where(eq(cartSnapshots.userId, userId))
      .limit(1);
    if (!cart) return new Response("Cart not found", { status: 404 });

    const items = (JSON.parse(cart.itemsJson) as CartItem[]).slice(0, 4);
    const width = 1200;
    const rowHeight = 112;
    const rowGap = 12;
    const rowStart = 166;
    const thumbnailX = 66;
    const thumbnailSize = 88;

    const rows = items.map((item, index) => {
      const y = rowStart + index * (rowHeight + rowGap);
      return `
        <rect x="48" y="${y}" width="1104" height="${rowHeight}" rx="18" fill="#245643"/>
        <rect x="${thumbnailX}" y="${y + 12}" width="${thumbnailSize}" height="${thumbnailSize}" rx="14" fill="#eef5f1"/>
        <text x="176" y="${y + 49}" class="item">${escapeXml(item.name)}</text>
        <text x="176" y="${y + 78}" class="quantity">Quantity ${item.quantity}</text>
        <text x="1118" y="${y + 64}" text-anchor="end" class="price">${money(item.price * item.quantity)}</text>`;
    }).join("");

    const allItems = JSON.parse(cart.itemsJson) as CartItem[];
    const totalY = rowStart + items.length * (rowHeight + rowGap) + 10;
    const height = Math.max(460, totalY + 90 + (allItems.length > 4 ? 30 : 0));
    const overflow = allItems.length > 4
      ? `<text x="52" y="${height - 18}" class="more">+ ${allItems.length - 4} more products in your cart</text>`
      : "";
    const svg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          text { font-family: Arial, Helvetica, sans-serif; }
          .brand { font-size: 23px; font-weight: 700; letter-spacing: 4px; fill: #d8f56f; }
          .count { font-size: 22px; fill: #b8d1c7; }
          .title { font-size: 43px; font-weight: 700; fill: white; }
          .item { font-size: 28px; font-weight: 700; fill: white; }
          .quantity { font-size: 19px; fill: #bcd3ca; }
          .price { font-size: 29px; font-weight: 700; fill: #f4f8f6; }
          .label { font-size: 21px; fill: #b8d1c7; }
          .total { font-size: 46px; font-weight: 700; fill: #d8f56f; }
          .more { font-size: 18px; fill: #b8d1c7; }
        </style>
        <rect width="1200" height="${height}" fill="#173d30"/>
        <text x="48" y="53" class="brand">CARTSENSE RECOVERY</text>
        <text x="1152" y="53" text-anchor="end" class="count">${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}</text>
        <text x="48" y="122" class="title">${escapeXml(cart.customerName)}&apos;s cart is waiting</text>
        ${rows}
        <line x1="48" y1="${totalY}" x2="1152" y2="${totalY}" stroke="#47705f" stroke-width="2"/>
        <text x="48" y="${totalY + 58}" class="label">Complete your purchase</text>
        <text x="1152" y="${totalY + 63}" text-anchor="end" class="total">${money(cart.cartTotal)}</text>
        ${overflow}
      </svg>`);

    const overlays = items.flatMap((item, index) => {
      if (!item.id) return [];
      const dataUri = productImages[String(item.id) as keyof typeof productImages];
      if (!dataUri) return [];
      const encoded = dataUri.split(",")[1];
      return [{
        input: Buffer.from(encoded, "base64"),
        left: thumbnailX,
        top: rowStart + index * (rowHeight + rowGap) + 12,
      }];
    });

    const output = await sharp(svg).composite(overlays).png().toBuffer();
    return new Response(new Uint8Array(output), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Cart image generation failed", error);
    return new Response("Unable to generate cart image", { status: 500 });
  }
}
