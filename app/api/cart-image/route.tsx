import { eq } from "drizzle-orm";
import { writeFile } from "node:fs/promises";
import sharp, { type OverlayOptions } from "sharp";
import { ensureDb, getDb } from "../../../db";
import { cartSnapshots } from "../../../db/schema";
import cartFont from "../../../data/cart-font.json";
import productImages from "../../../data/product-images.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CartItem = { id?: number; name: string; quantity: number; price: number };
type CartCreative = {
  customerName: string;
  itemCount: number;
  cartTotal: number;
  items: CartItem[];
};

const FONT_PATH = "/tmp/cartsense-poppins.ttf";
const escapeMarkup = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

function textOverlay(
  text: string,
  left: number,
  top: number,
  width: number,
  height: number,
  size: number,
  color: string,
  weight: "normal" | "bold" = "normal",
  align: "left" | "right" = "left",
): OverlayOptions {
  return {
    input: {
      text: {
        text: `<span foreground="${color}" font_weight="${weight}" font_size="${size * 1024}">${escapeMarkup(text)}</span>`,
        font: "Poppins",
        fontfile: FONT_PATH,
        width,
        height,
        align,
        rgba: true,
        wrap: "none",
      },
    },
    left,
    top,
  };
}

export async function renderCartCreative(cart: CartCreative) {
  await writeFile(FONT_PATH, Buffer.from(cartFont.poppins, "base64"));

  const items = cart.items.slice(0, 4);
  const width = 1200;
  const rowStart = 154;
  const rowHeight = 116;
  const rowGap = 12;
  const thumbX = 66;
  const thumbSize = 92;
  const totalY = rowStart + items.length * (rowHeight + rowGap) + 12;
  const height = Math.max(460, totalY + 92 + (cart.items.length > 4 ? 30 : 0));

  const rowShapes = items.map((_, index) => {
    const y = rowStart + index * (rowHeight + rowGap);
    return `<rect x="48" y="${y}" width="1104" height="${rowHeight}" rx="18" fill="#245643"/>
      <rect x="${thumbX}" y="${y + 12}" width="${thumbSize}" height="${thumbSize}" rx="14" fill="#eef5f1"/>`;
  }).join("");
  const background = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#173d30"/>
    ${rowShapes}
    <line x1="48" y1="${totalY}" x2="1152" y2="${totalY}" stroke="#47705f" stroke-width="2"/>
  </svg>`);

  const overlays: OverlayOptions[] = [
    textOverlay("CARTSENSE ", 48, 34, 620, 38, 23, "#d8f56f", "bold"),
    textOverlay(`${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`, 902, 34, 250, 38, 21, "#b8d1c7", "normal", "right"),
    textOverlay(`${cart.customerName}'s cart is waiting`, 48, 84, 1104, 56, 42, "#ffffff", "bold"),
    textOverlay("Complete your purchase", 48, totalY + 30, 500, 42, 21, "#b8d1c7"),
    textOverlay(money(cart.cartTotal), 802, totalY + 20, 350, 58, 44, "#d8f56f", "bold", "right"),
  ];

  for (const [index, item] of items.entries()) {
    const y = rowStart + index * (rowHeight + rowGap);
    if (item.id) {
      const dataUri = productImages[String(item.id) as keyof typeof productImages];
      if (dataUri) {
        const thumbnail = await sharp(Buffer.from(dataUri.split(",")[1], "base64"))
          .resize(thumbSize, thumbSize, { fit: "contain", background: "#eef5f1" })
          .jpeg({ quality: 84 })
          .toBuffer();
        overlays.push({ input: thumbnail, left: thumbX, top: y + 12 });
      }
    }
    overlays.push(
      textOverlay(item.name, 180, y + 21, 680, 42, 27, "#ffffff", "bold"),
      textOverlay(`Quantity ${item.quantity}`, 180, y + 67, 400, 30, 19, "#bcd3ca"),
      textOverlay(money(item.price * item.quantity), 884, y + 38, 234, 42, 28, "#f4f8f6", "bold", "right"),
    );
  }

  if (cart.items.length > 4) {
    overlays.push(textOverlay(
      `+ ${cart.items.length - 4} more products in your cart`,
      48,
      height - 28,
      600,
      24,
      17,
      "#b8d1c7",
    ));
  }

  return sharp(background).composite(overlays).png().toBuffer();
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    if (process.env.NODE_ENV !== "production" && requestUrl.searchParams.get("preview") === "1") {
      const output = await renderCartCreative({
        customerName: "Karthik Kumar",
        itemCount: 3,
        cartTotal: 3981,
        items: [
          { id: 2, name: "Eyeshadow Palette with Mirror", quantity: 1, price: 1659 },
          { id: 3, name: "Powder Canister", quantity: 1, price: 1244 },
          { id: 4, name: "Red Lipstick", quantity: 1, price: 1078 },
        ],
      });
      return new Response(new Uint8Array(output), { headers: { "Content-Type": "image/png" } });
    }
    await ensureDb();
    const userId = requestUrl.searchParams.get("userId");
    if (!userId) return new Response("userId required", { status: 400 });
    const [cart] = await getDb().select().from(cartSnapshots)
      .where(eq(cartSnapshots.userId, userId)).limit(1);
    if (!cart) return new Response("Cart not found", { status: 404 });

    const output = await renderCartCreative({
      customerName: cart.customerName,
      itemCount: cart.itemCount,
      cartTotal: cart.cartTotal,
      items: JSON.parse(cart.itemsJson) as CartItem[],
    });
    return new Response(new Uint8Array(output), {
      headers: { "Content-Type": "image/png", "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Cart image generation failed", error);
    return new Response("Unable to generate cart image", { status: 500 });
  }
}
