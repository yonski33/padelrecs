import sharp from "sharp";

const TOLERANCE = 26; // per colour channel, against the photo's own background

/**
 * Makes a product photo's plain background transparent, so white, grey and tinted sources all sit on the site's tint.
 * Fills inward from the edges, so a white area inside the product stays. A photo whose corners differ has no plain
 * background to remove, and is returned as it was.
 */
export async function clearBackground(input: Buffer) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info, at = (x: number, y: number) => (y * width + x) * 4;
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)];
  const near = (a: number, b: number, tolerance = TOLERANCE) => Math.abs(data[a] - data[b]) <= tolerance && Math.abs(data[a + 1] - data[b + 1]) <= tolerance && Math.abs(data[a + 2] - data[b + 2]) <= tolerance;
  if (!corners.every(c => near(c, corners[0], 40))) return input;
  const seen = new Uint8Array(width * height), stack: number[] = [];
  const push = (x: number, y: number) => { const i = y * width + x; if (!seen[i]) { seen[i] = 1; stack.push(i); } };
  for (let x = 0; x < width; x++) { push(x, 0); push(x, height - 1); }
  for (let y = 0; y < height; y++) { push(0, y); push(width - 1, y); }
  while (stack.length) {
    const i = stack.pop()!, p = i * 4;
    if (!corners.some(c => near(p, c))) continue;
    data[p + 3] = 0;
    const x = i % width, y = (i - x) / width;
    if (x > 0) push(x - 1, y); if (x < width - 1) push(x + 1, y);
    if (y > 0) push(x, y - 1); if (y < height - 1) push(x, y + 1);
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

/** An uploaded photo, ready to store: upright, at most 640px, background cleared and trimmed to the product. */
export async function preparePhoto(input: Buffer) {
  const sized = await sharp(input).rotate().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).png().toBuffer();
  return sharp(await clearBackground(sized)).trim({ threshold: 10 }).webp({ quality: 82, alphaQuality: 90 }).toBuffer();
}
