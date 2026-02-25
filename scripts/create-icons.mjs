/**
 * WARLEVEL — Icon Generator (pure Node.js, no npm deps)
 * Creates minimal valid PNG icons for PWA installation.
 * Run: node scripts/create-icons.mjs
 */

import { deflateSync } from "zlib";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public", "icons");

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPNG(size, bgR, bgG, bgB, fgR, fgG, fgB) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Draw "W" letter in center area
  const rows = [];
  const letterSize = Math.floor(size * 0.5);
  const offsetX = Math.floor((size - letterSize) / 2);
  const offsetY = Math.floor((size - letterSize) / 2);

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(size * 3 + 1);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const lx = x - offsetX;
      const ly = y - offsetY;

      let isLetter = false;
      if (lx >= 0 && lx < letterSize && ly >= 0 && ly < letterSize) {
        const nx = lx / letterSize;
        const ny = ly / letterSize;
        const thickness = 0.12;

        // Left stroke
        if (nx < thickness) isLetter = true;
        // Right stroke
        if (nx > 1 - thickness) isLetter = true;
        // Middle-left diagonal (going down-right)
        if (Math.abs(nx - ny * 0.5 - 0.25) < thickness * 0.7 && ny > 0.5) isLetter = true;
        // Middle-right diagonal (going down-left)
        if (Math.abs(nx + ny * 0.5 - 0.75) < thickness * 0.7 && ny > 0.5) isLetter = true;
      }

      const r = isLetter ? fgR : bgR;
      const g = isLetter ? fgG : bgG;
      const b = isLetter ? fgB : bgB;

      row[1 + x * 3] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }

  const rawData = Buffer.concat(rows);
  const compressed = deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(publicDir, { recursive: true });

// Dark background (#09090b) with red "W" (#ef4444)
const icon192 = createPNG(192, 9, 9, 11, 239, 68, 68);
const icon512 = createPNG(512, 9, 9, 11, 239, 68, 68);

writeFileSync(join(publicDir, "icon-192.png"), icon192);
writeFileSync(join(publicDir, "icon-512.png"), icon512);

console.log("Icons generated:");
console.log(" → public/icons/icon-192.png");
console.log(" → public/icons/icon-512.png");
