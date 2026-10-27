const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const id of (process.env.PLANET_LANDMARKS || 'urdwell,hindsight').split(',')) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1080 }, reducedMotion: 'reduce', locale: 'fr-FR' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.env.PLANET_URL || 'http://127.0.0.1:5180/'}?debug=1`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.planet?.mode === 'intro');
      await page.locator('[data-intro="land"]').click();
      await page.waitForFunction(() => planet.mode === 'play');
      await page.locator('.world-canvas').focus();
      await page.keyboard.press('j');
      await page.locator(`[data-travel="${id}"]`).click();
      await page.waitForFunction(id => planet.mode === 'play' && !planet.rig.isFlying && planet.promptEntry?.place.id === id, id);
      await page.screenshot({ path: `qa/screenshots/${id}-new-ground.png` });
      await page.locator('.world-canvas').focus();
      await page.keyboard.press('e');
      await page.waitForFunction(id => planet.panel.isOpen && planet.panel.place.id === id, id);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !planet.panel.isOpen);
      for (const mode of ['day', 'night', 'rear']) {
        await page.evaluate(({ id, mode }) => {
          const game = planet, entry = game.world.landmarks.entry(id);
          game.renderer.renderer.setAnimationLoop(null);
          game.ui.style.display = 'none';
          const coordinates = id === 'urdwell' ? [17, 11, 23] : [12, 9, 17];
          if (mode === 'rear') { coordinates[0] *= -1; coordinates[2] *= -1; }
          const target = id === 'urdwell' ? [0, 6.7, -1] : [0, 2.8, -0.5];
          game.camera.position.copy(entry.place.direction.clone().set(...coordinates).applyMatrix4(entry.toWorld));
          game.camera.up.copy(entry.place.direction);
          game.camera.lookAt(entry.place.direction.clone().set(...target).applyMatrix4(entry.toWorld));
          game.camera.updateMatrixWorld(true);
          const night = mode === 'night';
          const sunDirection = entry.place.direction.clone().set(0.5, 1, 1).applyQuaternion(entry.root.quaternion).normalize();
          if (night) sunDirection.negate();
          game.world.sky.update({ camera: game.camera, up: entry.place.direction, focus: entry.root.position,
            sunDirection, spaceFactor: 0, deltaSeconds: 0 });
          game.world.materials.updateNight(night ? 1 : 0);
          game.world.landmarks.update(0, 0, { nightFactor: night ? 1 : 0, spaceFactor: 0 });
          game.renderer.render();
        }, { id, mode });
        await page.screenshot({ path: `qa/screenshots/${id}-new-${mode}.png` });
      }
      await page.close();
      console.log(`${id}: actual travel, E interaction, day/night/rear screenshots PASS`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
