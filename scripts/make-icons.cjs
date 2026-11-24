// Rasterises public/icons/logo.svg into the PWA icon sizes using the pre-installed Chromium.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const svg = fs.readFileSync('public/icons/logo.svg', 'utf8');
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const shot = async (size, file, maskable) => {
    await p.setViewportSize({ width: size, height: size });
    const inner = maskable
      ? `<div style="width:${size}px;height:${size}px;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:grid;place-items:center"><div style="width:${size * 0.8}px;height:${size * 0.8}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></div>`
      : svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
    await p.setContent(`<html><body style="margin:0;background:transparent">${inner}</body></html>`);
    await p.screenshot({ path: file, omitBackground: true });
  };
  await shot(192, 'public/icons/icon-192.png');
  await shot(512, 'public/icons/icon-512.png');
  await shot(512, 'public/icons/icon-maskable-512.png', true);
  await shot(180, 'public/icons/apple-touch-icon.png', true);
  await b.close();
  console.log('icons written');
})();
