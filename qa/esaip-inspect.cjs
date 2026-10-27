const { chromium } = require('playwright');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('qa/screenshots', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5180/?debug=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.planet?.mode === 'intro');
  await page.evaluate(async () => {
    planet.rig.update = () => {};
    planet.mode = 'inspect';
    planet.ui.style.display = 'none';
    // The builder can be inspected independently while integration is ongoing.
    const { Kit } = await import('/src/world/Kit.js');
    const { MaterialLibrary } = await import('/src/world/materials.js');
    const { buildEsaip } = await import('/src/world/landmarks/esaipCampus.js');
    const { TextureLoader, SRGBColorSpace } = await import('/node_modules/.vite/deps/three.js');
    const entry = planet.world.landmarks.entry('esaip');
    entry.root.visible = false;
    const kit = new Kit(new MaterialLibrary(), entry.place);
    const pending = [];
    buildEsaip(kit, { loadTexture: url => {
      let resolve;
      pending.push(new Promise(done => { resolve = done; }));
      const texture = new TextureLoader().load(url, resolve);
      texture.colorSpace = SRGBColorSpace;
      return texture;
    } });
    const root = kit.bake();
    root.position.copy(entry.root.position);
    root.quaternion.copy(entry.root.quaternion);
    entry.root.parent.add(root);
    planet.player.placeAt(entry.spawnPoint, entry.interactPoint);
    planet.world.dayCycle.angle = Math.atan2(entry.place.direction.x, entry.place.direction.z) + 0.3;
    await Promise.all(pending);
  });
  for (const [name, position, target] of [
    ['front', [10, 6.7, 12], [0, 1.8, -0.8]],
    ['ground', [1.8, 2.2, 11.8], [0, 2.15, -0.7]],
    ['rear', [-10, 6.7, -12], [0, 1.6, -1.3]],
  ]) {
    await page.evaluate(({ position, target }) => {
      const entry = planet.world.landmarks.entry('esaip');
      planet.camera.position.set(...position).applyMatrix4(entry.toWorld);
      planet.camera.up.copy(entry.place.direction);
      planet.camera.lookAt(planet.camera.position.clone().set(...target).applyMatrix4(entry.toWorld));
    }, { position, target });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `qa/screenshots/esaip-real-${name}.png` });
  }
  console.log(JSON.stringify({ screenshots: 3, errors }));
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
