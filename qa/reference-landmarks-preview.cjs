const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('qa/screenshots', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const id of (process.env.PLANET_LANDMARKS || 'ouaga,labo').split(',')) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce', locale: 'fr-FR' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.env.PLANET_URL || 'http://127.0.0.1:5180/'}?debug=1`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.planet?.mode === 'intro');
      await page.locator('[data-intro="journal"]').click();
      await page.locator(`[data-travel="${id}"]`).click();
      await page.waitForFunction(id => planet.mode === 'play' && !planet.rig.isFlying && planet.promptEntry?.place.id === id, id);
      await page.screenshot({ path: `qa/screenshots/${id}-reference-ground.png` });
      await page.locator('.world-canvas').focus();
      await page.keyboard.press('e');
      await page.waitForFunction(id => planet.panel.isOpen && planet.panel.place.id === id, id);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !planet.panel.isOpen);
      for (const view of ['day', 'night', 'rear', 'detail']) {
        await page.evaluate(({ id, view }) => {
          const entry = planet.world.landmarks.entry(id);
          planet.renderer.renderer.setAnimationLoop(null);
          planet.ui.style.display = 'none';
          let camera = [12, 9, 18], target = [0, 3, -0.8];
          if (view === 'rear') camera = [-12, 9, -18];
          if (view === 'detail') {
            camera = id === 'ouaga' ? [4.8, 3.5, 11] : [4, 2.2, 8];
            target = id === 'ouaga' ? [0, 2.6, 0] : [0, 1.8, -0.5];
          }
          planet.camera.position.set(...camera).applyMatrix4(entry.toWorld);
          planet.camera.up.copy(entry.place.direction);
          planet.camera.lookAt(entry.place.direction.clone().set(...target).applyMatrix4(entry.toWorld));
          planet.camera.updateMatrixWorld(true);
          const night = view === 'night';
          const sunDirection = entry.place.direction.clone().set(0.5, 1, 1).applyQuaternion(entry.root.quaternion).normalize();
          if (night) sunDirection.negate();
          planet.world.sky.update({ camera: planet.camera, up: entry.place.direction, focus: entry.root.position,
            sunDirection, spaceFactor: 0, deltaSeconds: 0 });
          planet.world.materials.updateNight(night ? 1 : 0);
          planet.world.landmarks.update(0, 0, { nightFactor: night ? 1 : 0, spaceFactor: 0 });
          planet.renderer.render();
        }, { id, view });
        await page.screenshot({ path: `qa/screenshots/${id}-reference-${view}.png` });
      }
      await page.close();
      console.log(`${id}: real journal arrival, E panel, day/night/rear/detail renders PASS`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
