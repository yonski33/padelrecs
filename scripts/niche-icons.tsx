import React from "react";
import { mkdir, writeFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { niche } from "../lib/niche";
import { arts } from "../app/art";

// Writes public/niches/<niche>/{icon.svg, favicon.ico, apple-icon.png} from the niche's logo (app/art/<niche>.tsx).
// Usage: NICHE=pickleball npx tsx scripts/niche-icons.tsx   (padel's original files are kept as they are)
const dir = `public/niches/${niche.id}`;
const logo = renderToStaticMarkup(React.createElement(arts[niche.id].LogoIcon)).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: 72 * size / 20 }).resize(size, size).png().toBuffer();
// Home-screen icon: the share card's rating icon on the share-card background, like padel's. The logo itself is drawn
// in the share-card background colour on most niches, so on that tile it would disappear.
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="${niche.og.background}"/><g transform="translate(30 30) scale(6)">${niche.og.scoreOn.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</g></svg>`;

// ICO container holding PNG images (supported by every current browser).
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    header.writeUInt8(size % 256, at); header.writeUInt8(size % 256, at + 1);
    header.writeUInt16LE(1, at + 4); header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8); header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(i => i.data)]);
}

if (niche.id === "padel") throw new Error("Padel keeps its hand-made icons in public/niches/padel.");
await mkdir(dir, { recursive: true });
await writeFile(`${dir}/icon.svg`, logo);
await writeFile(`${dir}/favicon.ico`, ico([{ size: 32, data: await png(logo, 32) }, { size: 48, data: await png(logo, 48) }]));
await writeFile(`${dir}/apple-icon.png`, await sharp(Buffer.from(tile)).resize(180, 180).png().toBuffer());
console.log(`Wrote ${dir}/icon.svg, favicon.ico, apple-icon.png`);
