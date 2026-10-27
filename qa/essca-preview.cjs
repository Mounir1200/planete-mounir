const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'fr-FR' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${process.env.PLANET_URL || 'http://127.0.0.1:5180/'}?debug=1`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.planet?.mode === 'intro');
    await page.locator('[data-intro="land"]').click();
    await page.waitForFunction(() => planet.mode === 'play');
    await page.locator('.world-canvas').focus();
    await page.keyboard.press('j');
    await page.locator('[data-travel="essca"]').click();
    await page.waitForFunction(() => planet.mode === 'play' && !planet.rig.isFlying);
    await page.waitForFunction(() => planet.promptEntry?.place.id === 'essca');
    await page.locator('.world-canvas').focus();
    await page.keyboard.press('e');
    await page.waitForFunction(() => planet.panel.isOpen && planet.panel.place.id === 'essca');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !planet.panel.isOpen);
    await page.screenshot({ path: 'qa/screenshots/essca-campus-ground.png' });
    for (const [name, coordinates] of [['front', [13, 9, 18]], ['rear', [-12, 8, -16]]]) {
      await page.evaluate(coordinates => {
        const game = planet;
        const entry = game.world.landmarks.entry('essca');
        game.renderer.renderer.setAnimationLoop(null);
        game.ui.style.display = 'none';
        const local = entry.place.direction.clone().set(...coordinates).applyMatrix4(entry.toWorld);
        const target = entry.place.direction.clone().set(0, 1.4, -0.6).applyMatrix4(entry.toWorld);
        game.camera.position.copy(local);
        game.camera.up.copy(entry.place.direction);
        game.camera.lookAt(target);
        game.camera.updateMatrixWorld(true);
        game.world.sky.update({ camera: game.camera, up: entry.place.direction, focus: entry.root.position,
          sunDirection: entry.place.direction.clone().set(0.5, 1, 1).applyQuaternion(entry.root.quaternion).normalize(),
          spaceFactor: 0, deltaSeconds: 0 });
        game.world.materials.updateNight(0);
        game.renderer.render();
      }, coordinates);
      await page.screenshot({ path: `qa/screenshots/essca-campus-${name}.png` });
    }
    assert.deepEqual(errors, []);
    console.log('ESSCA ground/front/rear preview rendered with no runtime errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
