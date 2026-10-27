const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  fs.mkdirSync('qa/screenshots', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:5180/?debug=1', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.planet?.mode === 'intro');
    await page.locator('[data-intro="journal"]').click();
    await page.locator('[data-travel="port"]').click();
    await page.waitForFunction(() => planet.mode === 'play');
    await page.evaluate(() => {
      const entry = planet.world.landmarks.entry('port');
      planet.rig.update = () => {};
      planet.rig.spaceFactor = 0;
      planet.mode = 'inspect'; planet.ui.hidden = true;
      planet.world.dayCycle.angle = Math.atan2(entry.place.direction.x, entry.place.direction.z) + 0.3;
      planet.camera.position.set(13, 10, 20).applyMatrix4(entry.toWorld);
      planet.camera.up.copy(entry.place.direction);
      planet.camera.lookAt(planet.player.position.clone().set(0, 0.3, 4).applyMatrix4(entry.toWorld));
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/harbour-overview.png' });
    await page.evaluate(() => {
      const entry = planet.world.landmarks.entry('port');
      planet.camera.position.set(0, 3.7, 4.5).applyMatrix4(entry.toWorld);
      planet.camera.lookAt(planet.player.position.clone().set(-0.2, -0.4, 10).applyMatrix4(entry.toWorld));
    });
    await page.screenshot({ path: 'qa/screenshots/harbour-pier.png' });
    assert.deepEqual(errors, []);
    console.log('Harbour preview: geometry, boats and walkway rendered with no runtime errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
