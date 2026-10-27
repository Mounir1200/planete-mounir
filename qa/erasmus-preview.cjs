const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const errors = [];
  try {
    for (const id of ['rwu', 'ktu']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'fr-FR' });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${process.env.PLANET_URL || 'http://127.0.0.1:5180/'}?debug=1`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.planet?.mode === 'intro');
      await page.locator('[data-intro="land"]').click();
      await page.waitForFunction(() => planet.mode === 'play');
      await page.locator('.world-canvas').focus();
      await page.keyboard.press('j');
      await page.locator(`[data-travel="${id}"]`).click();
      await page.waitForFunction(id => planet.mode === 'play' && !planet.rig.isFlying && planet.promptEntry?.place.id === id, id);
      await page.locator('.world-canvas').focus();
      await page.keyboard.press('e');
      await page.waitForFunction(id => planet.panel.isOpen && planet.panel.place.id === id, id);
      await page.screenshot({ path: `qa/screenshots/${id}-campus-interaction.png` });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !planet.panel.isOpen);
      await page.screenshot({ path: `qa/screenshots/${id}-campus-ground.png` });
      for (const [name, coordinates] of [['front', [11, 7, 16]], ['rear', [-10, 7, -14]]]) {
        await page.evaluate(({ id, coordinates }) => {
          const game = planet;
          const entry = game.world.landmarks.entry(id);
          game.renderer.renderer.setAnimationLoop(null);
          game.ui.style.display = 'none';
          game.camera.position.copy(entry.place.direction.clone().set(...coordinates).applyMatrix4(entry.toWorld));
          game.camera.up.copy(entry.place.direction);
          game.camera.lookAt(entry.place.direction.clone().set(0, 1.8, -0.4).applyMatrix4(entry.toWorld));
          game.camera.updateMatrixWorld(true);
          game.world.sky.update({ camera: game.camera, up: entry.place.direction, focus: entry.root.position,
            sunDirection: entry.place.direction.clone().set(0.5, 1, 1).applyQuaternion(entry.root.quaternion).normalize(),
            spaceFactor: 0, deltaSeconds: 0 });
          game.world.materials.updateNight(0);
          game.renderer.render();
        }, { id, coordinates });
        await page.screenshot({ path: `qa/screenshots/${id}-campus-${name}.png` });
      }
      await page.close();
      console.log(`${id}: journal travel, keyboard interaction, ground and both facades rendered`);
    }
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
