/**
 * Rebuild the maskable PWA icons from the existing regular icons.
 *
 * Problem this fixes: maskable-192/512.png were byte-identical copies of the
 * regular icons. Maskable icons are cropped to a circle/rounded-square by
 * Android launchers — artwork must sit inside an ~80% safe zone on a full-bleed
 * background, otherwise the brand mark gets clipped ("distorted icon").
 *
 * Approach: downscale the regular 512 icon into the safe zone and composite it
 * over the same dark brand background, full-bleed. Run once via:
 *   node scripts/make-maskable-icons.mjs
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

async function makeMaskable(size) {
  const src = path.join(root, "public/icons/icon-512.png");
  // Safe zone = central 80% → scale the artwork to 80% of the full bleed.
  const inner = Math.round(size * 0.8);
  const inset = Math.round((size - inner) / 2);

  const art = await sharp(src)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // Full-bleed brand background (matches the icon's #12101D tile colour).
  const bg = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 18, g: 16, b: 29, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([{ input: art, left: inset, top: inset }])
    .png()
    .toFile(path.join(root, `public/icons/maskable-${size}.png`));

  console.log(`maskable-${size}.png written (${inner}px art on ${size}px bleed)`);
}

await makeMaskable(192);
await makeMaskable(512);
console.log("Done.");
