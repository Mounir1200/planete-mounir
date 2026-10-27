const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const url = process.env.PLANET_URL || 'http://127.0.0.1:5180/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => localStorage.setItem('planete-mounir:v1', JSON.stringify({
      visited: ['essca', 'urdwell', 'hindsight', 'phare', 'port'], skills: [],
      finaleSeen: true, reducedMotion: true, quality: 'high',
    })));
    await page.goto(`${url}?debug=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.planet?.mode === 'intro');
    await page.locator('[data-intro="land"]').click();
    await page.waitForFunction(() => planet.mode === 'play');
    await page.locator('.world-canvas').focus();
    await page.keyboard.press('j');
    await page.locator('[data-travel="port"]').click();
    await page.waitForFunction(() => planet.mode === 'play');
    await page.waitForTimeout(1000);
    const pixels = await page.evaluate(() => {
      planet.renderer.renderer.setAnimationLoop(null);
      planet.renderer.render();
      const gl = planet.renderer.renderer.getContext();
      const data = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
      gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let black = 0;
      for (let index = 0; index < data.length; index += 4) {
        if (data[index] === 0 && data[index + 1] === 0 && data[index + 2] === 0) black += 1;
      }
      return { black, total: data.length / 4, ratio: black / (data.length / 4) };
    });
    assert.ok(pixels.ratio < 0.01, `Lit beacons must not black out the frame: ${JSON.stringify(pixels)}`);
    await page.screenshot({ path: 'qa/screenshots/fixed-beacons.png' });
    assert.deepEqual(errors, []);
    console.log('Lit-beacon bloom regression PASS', pixels);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
