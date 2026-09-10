import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const source = await readFile("app/shop/page.tsx", "utf8");
const start = source.indexOf("const catalog =") + "const catalog =".length;
const end = source.indexOf("] as const;", start) + 1;
const catalog = Function(`return (${source.slice(start, end)})`)();
const products = catalog.flatMap(([category, names], categoryIndex) =>
  names.map((name, nameIndex) => ({
    id: categoryIndex * 10 + nameIndex + 1,
    name,
    category,
    lock: categoryIndex * 10 + nameIndex + 301,
  })),
);

await mkdir("public/products", { recursive: true });

async function download(product) {
  const query = encodeURIComponent(`${product.name},${product.category}`.replaceAll(" ", ","));
  const response = await fetch(`https://loremflickr.com/700/540/${query}?lock=${product.lock}`, {
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`${product.name}: HTTP ${response.status}`);
  const output = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize(560, 420, { fit: "cover" })
    .webp({ quality: 76 })
    .toBuffer();
  await writeFile(path.join("public/products", `${product.id}.webp`), output);
  process.stdout.write(`✓ ${product.id} ${product.name}\n`);
}

for (let index = 0; index < products.length; index += 10) {
  await Promise.all(products.slice(index, index + 10).map(download));
}
