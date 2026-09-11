import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const databasePath = process.env.DUMMYJSON_PRODUCTS_FILE ||
  "/workspace/scratch/97f16ec8b96a/dummyjson-source/database/products.json";
const sourceProducts = JSON.parse(await readFile(databasePath, "utf8")).slice(0, 100);
const products = sourceProducts.map((product, index) => ({
  id: index + 1,
  name: product.title,
  category: product.category.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "),
  price: Math.max(199, Math.round(Number(product.price) * 83)),
  rating: Number(product.rating).toFixed(1),
  image: `/products/${index + 1}.png`,
  sourceImage: product.thumbnail,
}));

await mkdir("public/products", { recursive: true });
await mkdir("data", { recursive: true });
await writeFile("data/product-catalog.json", JSON.stringify(products.map((product) => ({
  id: product.id,
  name: product.name,
  category: product.category,
  price: product.price,
  rating: product.rating,
  image: product.image,
})), null, 2));

async function download(product) {
  const response = await fetch(product.sourceImage, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`${product.name}: HTTP ${response.status}`);
  const output = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(560, 420, { fit: "contain", background: "#eef5f1" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(path.join("public/products", `${product.id}.png`), output);
  process.stdout.write(`✓ ${product.id} ${product.name}\n`);
}

for (let index = 0; index < products.length; index += 20) {
  await Promise.all(products.slice(index, index + 20).map(download));
}

const embeddedImages = Object.fromEntries(await Promise.all(products.map(async (product) => {
  const source = await readFile(path.join("public/products", `${product.id}.png`));
  const thumbnail = await sharp(source)
    .resize(180, 135, { fit: "contain", background: "#eef5f1" })
    .jpeg({ quality: 78 })
    .toBuffer();
  return [product.id, `data:image/jpeg;base64,${thumbnail.toString("base64")}`];
})));
await writeFile("data/product-images.json", JSON.stringify(embeddedImages));

const fontPath = process.env.CART_FONT_FILE ||
  "/workspace/scratch/97f16ec8b96a/dummyjson-source/fonts/poppins.ttf";
const font = await readFile(fontPath);
await writeFile("data/cart-font.json", JSON.stringify({
  poppins: font.toString("base64"),
}));
