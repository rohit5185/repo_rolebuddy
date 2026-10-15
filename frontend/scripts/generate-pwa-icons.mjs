/**
 * generate-pwa-icons.mjs
 * Generates PWA icon set from the master RoleBuddy logo.
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "..", "Extra_References", "RoleBuddy_LOGO.png");
const OUT = join(ROOT, "public", "icons");

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const ICONS = [
  { name: "icon-16.png",  size: 16  },
  { name: "icon-32.png",  size: 32  },
  { name: "icon-72.png",  size: 72  },
  { name: "icon-96.png",  size: 96  },
  { name: "icon-128.png", size: 128 },
  { name: "icon-144.png", size: 144 },
  { name: "icon-152.png", size: 152 },
  { name: "icon-180.png", size: 180 },
  { name: "icon-192.png", size: 192 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
];

console.log("🎨 Generating PWA icons from RoleBuddy_LOGO.png...\n");

for (const { name, size } of ICONS) {
  const outPath = join(OUT, name);
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 249, g: 248, b: 254, alpha: 1 } })
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${name} (${size}×${size})`);
}

// Maskable icon — logo centered on branded bg with padding for safe zone
const maskablePath = join(OUT, "icon-512-maskable.png");
await sharp(SRC)
  .resize(416, 416, { fit: "contain", background: { r: 59, g: 42, b: 225, alpha: 0 } })
  .extend({ top: 48, bottom: 48, left: 48, right: 48, background: { r: 249, g: 248, b: 254, alpha: 1 } })
  .resize(512, 512)
  .png()
  .toFile(maskablePath);
console.log("  ✓ icon-512-maskable.png (512×512, safe-zone padded)");

// Apple touch icon (180px, white bg)
const applePath = join(ROOT, "public", "apple-touch-icon.png");
await sharp(SRC)
  .resize(150, 150, { fit: "contain", background: { r: 249, g: 248, b: 254, alpha: 1 } })
  .extend({ top: 15, bottom: 15, left: 15, right: 15, background: { r: 249, g: 248, b: 254, alpha: 1 } })
  .resize(180, 180)
  .png()
  .toFile(applePath);
console.log("  ✓ apple-touch-icon.png (180×180)");

// Favicon
const faviconPath = join(ROOT, "public", "favicon.ico");
await sharp(SRC)
  .resize(32, 32, { fit: "contain", background: { r: 249, g: 248, b: 254, alpha: 1 } })
  .png()
  .toFile(join(OUT, "favicon-32.png"));
console.log("  ✓ icons/favicon-32.png (for favicon reference)");

console.log("\n✅ All PWA icons generated successfully!");
