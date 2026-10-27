const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('qa/screenshots', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5180/?debug=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.planet?.mode === 'intro');
  await page.evaluate(() => {
    planet.rig.update = () => {};
    planet.mode = 'inspect';
    planet.ui.style.display = 'none';
  });
  for (const id of ['maison', 'essca', 'esaip', 'poste', 'galerie']) {
    for (const side of ['front', 'rear']) {
      await page.evaluate(({ id, side }) => {
        const entry = planet.world.landmarks.entry(id);
        const high = id === 'essca';
        const position = side === 'front' ? [12, high ? 11 : 7.8, 13] : [-10, high ? 10 : 6.8, -14];
        planet.player.placeAt(entry.spawnPoint, entry.interactPoint);
        planet.world.dayCycle.angle = Math.atan2(entry.place.direction.x, entry.place.direction.z) + 0.3;
        planet.camera.position.set(...position).applyMatrix4(entry.toWorld);
        planet.camera.up.copy(entry.place.direction);
        planet.camera.lookAt(planet.camera.position.clone().set(0, high ? 4.8 : 1.8, -1.4).applyMatrix4(entry.toWorld));
      }, { id, side });
      await page.waitForTimeout(100);
      await page.screenshot({ path: `qa/screenshots/town-${id}-${side}.png` });
    }
  }
  console.log(JSON.stringify({ screenshots: 10, errors }));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
