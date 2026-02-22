const fs = require('fs');
const path = require('path');

// SVG template for the icon
const createSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#4f46e5"/>
  <path d="M384 208v-32c0-35.3-28.7-64-64-64H192c-35.3 0-64 28.7-64 64v32m256 0v112c0 35.3-28.7 64-64 64H192c-35.3 0-64-28.7-64-64V208m256 0h-38.6c-3.5 0-6.8 1.4-9.3 3.9l-40.1 40.1c-2.4 2.4-5.8 3.9-9.3 3.9h-52.6c-3.5 0-6.8-1.4-9.3-3.9l-40.1-40.1c-2.4-2.4-5.8-3.9-9.3-3.9H128" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(process.cwd(), 'public', 'icons');

// Use sharp to generate icons
async function generateWithSharp() {
  const sharp = require('sharp');
  const svg = createSvg();
  
  for (const size of sizes) {
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
    console.log(`Generated icon-${size}x${size}.png`);
  }
  console.log('All icons generated successfully!');
}

generateWithSharp().catch(console.error);
