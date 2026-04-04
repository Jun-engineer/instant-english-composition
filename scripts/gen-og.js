const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const WIDTH = 1200;
const HEIGHT = 630;
const LOGO_SIZE = 340;
const WHITE_THRESH = 200;

function isWhitish(data, idx) {
  const a = data[idx + 3];
  if (a < 30) return true;
  return data[idx] > WHITE_THRESH && data[idx + 1] > WHITE_THRESH && data[idx + 2] > WHITE_THRESH;
}

async function floodFillRemoveWhite(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  // Seed border pixels
  for (let x = 0; x < w; x++) {
    for (const y of [0, h - 1]) {
      const pi = y * w + x;
      if (isWhitish(data, pi * 4) && !visited[pi]) { visited[pi] = 1; queue.push(pi); }
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [0, w - 1]) {
      const pi = y * w + x;
      if (isWhitish(data, pi * 4) && !visited[pi]) { visited[pi] = 1; queue.push(pi); }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const pi = queue[head++];
    data[pi * 4 + 3] = 0;
    const px = pi % w, py = Math.floor(pi / w);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = px + dx, ny = py + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (!visited[ni] && isWhitish(data, ni * 4)) { visited[ni] = 1; queue.push(ni); }
    }
  }

  console.log(path.basename(inputPath) + ': flood-filled ' + queue.length + ' pixels');
  const tmpPath = inputPath + '.tmp.png';
  await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(tmpPath);
  fs.renameSync(tmpPath, inputPath);
  return { data, w, h };
}

async function createOgImage() {
  const iconDir = path.join(__dirname, '..', 'public/icons');

  // Remove white background from icon files
  await floodFillRemoveWhite(path.join(iconDir, 'speedspeak-192.png'));
  await floodFillRemoveWhite(path.join(iconDir, 'speedspeak-512.png'));

  // Build OG image from the now-transparent 512 icon
  const cleanIcon = await sharp(path.join(iconDir, 'speedspeak-512.png'))
    .trim()
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgBg = `
    <svg width="${WIDTH}" height="${HEIGHT}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 + LOGO_SIZE / 2 + 45}"
            font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="bold"
            fill="rgba(255,255,255,0.9)" text-anchor="middle"
            letter-spacing="3">INSTANT ENGLISH COMPOSITION TRAINING</text>
      <text x="${WIDTH / 2}" y="${HEIGHT / 2 + LOGO_SIZE / 2 + 85}"
            font-family="Arial, Helvetica, sans-serif" font-size="22"
            fill="rgba(255,255,255,0.7)" text-anchor="middle"
            letter-spacing="2">CEFR A1-C2 &#xB7; 2,000+ Cards &#xB7; Free</text>
    </svg>
  `;

  await sharp(Buffer.from(svgBg))
    .composite([
      {
        input: cleanIcon,
        top: Math.round((HEIGHT - LOGO_SIZE) / 2 - 55),
        left: Math.round((WIDTH - LOGO_SIZE) / 2),
      }
    ])
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'og-image.png'));

  console.log('Done');
}

createOgImage().catch(console.error);
