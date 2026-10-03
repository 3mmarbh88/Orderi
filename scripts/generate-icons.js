import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer with filter byte at start of each scanline (filter type 0 = None)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: RGBA (6)
  ihdrData[10] = 0; // Compression method: 0
  ihdrData[11] = 0; // Filter method: 0
  ihdrData[12] = 0; // Interlace method: 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT Chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND Chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(12 + length);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = calculateCRC(chunk.subarray(4, 8 + length));
  chunk.writeInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function calculateCRC(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ -1) | 0;
}

// Drawing function for Orderi Radar Icon
function drawOrderiIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = w / 2;

  // Background gradient: Deep blue / Indigo (#1e3a8a to #0f172a)
  const gradRatio = (y / h) * 0.8 + (x / w) * 0.2;
  const bgR = Math.floor(26 * (1 - gradRatio) + 15 * gradRatio);
  const bgG = Math.floor(58 * (1 - gradRatio) + 23 * gradRatio);
  const bgB = Math.floor(138 * (1 - gradRatio) + 42 * gradRatio);

  if (isMaskable) {
    // Full bleed background for maskable
    // Radar concentric circles within 80% safe zone
    const r1 = maxR * 0.22;
    const r2 = maxR * 0.44;
    const r3 = maxR * 0.66;
    const r4 = maxR * 0.78;

    // Rings
    const isRing = [r1, r2, r3, r4].some(r => Math.abs(dist - r) < (w > 256 ? 3 : 1.5));
    // Crosshairs
    const isAxis = (Math.abs(dx) < (w > 256 ? 2 : 1) || Math.abs(dy) < (w > 256 ? 2 : 1)) && dist < r4;

    // Radar beam sweep in upper-right quadrant
    const angle = Math.atan2(dy, dx); // -PI to PI
    const inSweep = dist < r4 && angle >= -Math.PI / 2 && angle <= 0;

    // Radar blips (Order targets)
    const blip1 = Math.hypot(dx - r2 * 0.7, dy + r2 * 0.7) < (w > 256 ? 12 : 5);
    const blip2 = Math.hypot(dx + r3 * 0.5, dy + r3 * 0.5) < (w > 256 ? 8 : 4);

    if (blip1) return [16, 185, 129, 255]; // Emerald active order blip
    if (blip2) return [245, 158, 11, 255]; // Amber blip
    if (dist < (w > 256 ? 10 : 5)) return [59, 130, 246, 255]; // Center core
    if (isRing || isAxis) return [96, 165, 250, 220]; // Cyan-blue radar ring
    if (inSweep) {
      const sweepAlpha = Math.floor(180 * (1 - Math.abs(angle - 0) / (Math.PI / 2)));
      return [37, 99, 235, Math.min(255, 120 + sweepAlpha)];
    }

    return [bgR, bgG, bgB, 255];
  }

  // Rounded icon with corner radius for any / apple-touch-icon
  const cornerRadius = w * 0.22;
  const inRoundedBox = (
    (x >= cornerRadius && x <= w - cornerRadius) ||
    (y >= cornerRadius && y <= h - cornerRadius) ||
    (Math.hypot(x - cornerRadius, y - cornerRadius) <= cornerRadius) ||
    (Math.hypot(x - (w - cornerRadius), y - cornerRadius) <= cornerRadius) ||
    (Math.hypot(x - cornerRadius, y - (h - cornerRadius)) <= cornerRadius) ||
    (Math.hypot(x - (w - cornerRadius), y - (h - cornerRadius)) <= cornerRadius)
  );

  if (!inRoundedBox) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Radar inside
  const r1 = maxR * 0.25;
  const r2 = maxR * 0.50;
  const r3 = maxR * 0.75;

  const isRing = [r1, r2, r3].some(r => Math.abs(dist - r) < (w > 256 ? 3.5 : 1.8));
  const isAxis = (Math.abs(dx) < (w > 256 ? 2.5 : 1.2) || Math.abs(dy) < (w > 256 ? 2.5 : 1.2)) && dist < r3;
  const angle = Math.atan2(dy, dx);
  const inSweep = dist < r3 && angle >= -Math.PI / 2 && angle <= 0;

  // Active delivery target blips
  const blip1 = Math.hypot(dx - r2 * 0.65, dy + r2 * 0.65) < (w > 256 ? 14 : 6);
  const blip2 = Math.hypot(dx + r2 * 0.8, dy + r2 * 0.4) < (w > 256 ? 9 : 4);

  if (blip1) return [16, 185, 129, 255]; // Emerald blip
  if (blip2) return [245, 158, 11, 255]; // Amber blip
  if (dist < (w > 256 ? 12 : 6)) return [239, 68, 68, 255]; // Red / Bahrain pin core
  if (isRing || isAxis) return [147, 197, 253, 230];
  if (inSweep) {
    return [59, 130, 246, 210];
  }

  return [bgR, bgG, bgB, 255];
}

// Drawing function for WhatsApp Icon
function drawWhatsAppIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);
  const r = w * 0.46;

  // Transparent outside outer circle
  if (dist > r) return [0, 0, 0, 0];

  // Green gradient background (#25D366 -> #128C7E)
  const grad = y / h;
  const gR = Math.floor(37 * (1 - grad) + 18 * grad);
  const gG = Math.floor(211 * (1 - grad) + 140 * grad);
  const gB = Math.floor(102 * (1 - grad) + 126 * grad);

  // White speech bubble inner circle
  const bubbleRadius = w * 0.28;
  const bubbleDy = dy + w * 0.01;
  const bubbleDist = Math.hypot(dx, bubbleDy);

  // Speech bubble pointer triangle (bottom left around angle 135 deg)
  const isPointer = (dx < -w * 0.12 && dx > -w * 0.28 && dy > w * 0.12 && dy < w * 0.28 && (dx + dy) < w * 0.05);

  if (bubbleDist <= bubbleRadius || isPointer) {
    // Phone handset cutout inside bubble (green)
    // Approximate a curved telephone shape in the center
    const pDist = Math.hypot(dx + w * 0.02, dy - w * 0.01);
    const pAngle = Math.atan2(dy, dx);
    const isPhoneBody = (pDist > w * 0.08 && pDist < w * 0.18 && pAngle > -Math.PI * 0.75 && pAngle < Math.PI * 0.35);
    const isEarpiece = Math.hypot(dx - w * 0.09, dy + w * 0.09) < w * 0.06;
    const isMouthpiece = Math.hypot(dx + w * 0.09, dy - w * 0.09) < w * 0.06;

    if (isPhoneBody || isEarpiece || isMouthpiece) {
      return [18, 140, 126, 255]; // WhatsApp dark emerald green
    }
    return [255, 255, 255, 255]; // Crisp white chat bubble
  }

  return [gR, gG, gB, 255];
}

// Generate all required icons in public/
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons in /public...');

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, (x, y, w, h) => drawOrderiIcon(x, y, w, h, false)));
console.log('✔ Generated pwa-192x192.png');

// WhatsApp Icon for realistic WhatsApp notifications
fs.writeFileSync(path.join(publicDir, 'whatsapp-icon.png'), createPNG(192, 192, (x, y, w, h) => drawWhatsAppIcon(x, y, w, h)));
console.log('✔ Generated whatsapp-icon.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawOrderiIcon(x, y, w, h, false)));
console.log('✔ Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, (x, y, w, h) => drawOrderiIcon(x, y, w, h, true)));
console.log('✔ Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, (x, y, w, h) => drawOrderiIcon(x, y, w, h, false)));
console.log('✔ Generated apple-touch-icon.png');

// 5. favicon.ico (as 32x32 png, browsers accept png favicons)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, (x, y, w, h) => drawOrderiIcon(x, y, w, h, false)));
console.log('✔ Generated favicon.ico');

// 6. icon.svg
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="sweep" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Radar Rings -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#60a5fa" stroke-width="4" stroke-opacity="0.6"/>
  <circle cx="256" cy="256" r="130" fill="none" stroke="#60a5fa" stroke-width="4" stroke-opacity="0.6"/>
  <circle cx="256" cy="256" r="70" fill="none" stroke="#60a5fa" stroke-width="4" stroke-opacity="0.7"/>
  <!-- Axes -->
  <line x1="256" y1="66" x2="256" y2="446" stroke="#93c5fd" stroke-width="3" stroke-opacity="0.5"/>
  <line x1="66" y1="256" x2="446" y2="256" stroke="#93c5fd" stroke-width="3" stroke-opacity="0.5"/>
  <!-- Sweep Sector -->
  <path d="M256,256 L446,256 A190,190 0 0,0 256,66 Z" fill="url(#sweep)" opacity="0.5"/>
  <!-- Active Target Blips -->
  <circle cx="345" cy="165" r="16" fill="#10b981" filter="drop-shadow(0 0 8px #10b981)"/>
  <circle cx="170" cy="340" r="12" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)"/>
  <!-- Center Core -->
  <circle cx="256" cy="256" r="14" fill="#ef4444"/>
  <circle cx="256" cy="256" r="6" fill="#ffffff"/>
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf-8');
console.log('✔ Generated icon.svg');
