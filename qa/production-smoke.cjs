const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, locale: 'fr-FR' });
  const errors = [], failures = [], wasm = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    if (response.url().endsWith('.wasm')) wasm.push({ status: response.status(), type: response.headers()['content-type'] });
  });
  try {
    await page.goto(`${process.env.PLANET_URL || 'http://127.0.0.1:5181/'}?debug=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.planet?.mode === 'intro');
    assert.equal(await page.evaluate(() => planet.world.landmarks.entries.length), 15);
    assert.equal(await page.evaluate(() => planet.player.physics.backend), 'rust-wasm');
    assert.equal(await page.evaluate(() => planet.rig.reducedMotion), false);
    await page.locator('[data-intro="journal"]').click();
    await page.locator('[data-travel="esaip"]').click();
    await page.waitForFunction(() => planet.mode === 'play' && !planet.rig.isFlying, null, { timeout: 30000 });
    const camera = await page.evaluate(() => {
      const entry = planet.world.landmarks.entry('esaip');
      return { local: planet.camera.position.clone().applyMatrix4(entry.toLocal).toArray(), steps: planet.player.physics.steps };
    });
    assert(camera.local[2] > 3, 'the animated arrival faces the entrance, not the back wall');
    await page.locator('.world-canvas').focus();
    await page.keyboard.press('e');
    await page.waitForFunction(() => planet.panel.isOpen && planet.panel.place.id === 'esaip');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !planet.panel.isOpen);
    await page.evaluate(() => planet.speech.say([], { replace: true }));
    await page.screenshot({ path: 'qa/screenshots/final-esaip-production.png' });
    const color = await page.locator('.prompt strong').evaluate(element => getComputedStyle(element).color);
    assert(color.match(/\d+/g).slice(0, 3).every(channel => Number(channel) > 225), 'interaction title uses readable light text');
    assert(wasm.length === 1 && wasm[0].status === 200 && wasm[0].type.includes('application/wasm'));
    assert.deepEqual(failures, []);
    assert.deepEqual(errors, []);
    console.log('Production PASS: 15 landmarks, Rust/Wasm served correctly, default animated ESAIP arrival, keyboard interaction, readable prompt, zero asset/runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
