const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const url = process.env.PLANET_URL || 'http://127.0.0.1:5180/';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${url}?debug=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.planet?.mode === 'intro');
  assert.equal(await page.locator('.world-labels').isVisible(), false, 'intro hides world labels');

  await page.locator('[data-intro="journal"]').click();
  await page.locator('[data-read="essca"]').click();
  // The official brand link now precedes the experience summaries. Reach the
  // summary through the real tab order instead of assuming it is first.
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement.tagName === 'SUMMARY')) break;
  }
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY', 'ESSCA summary is keyboard reachable');
  const summary = page.locator('.experience summary').first();
  const wasOpen = await summary.evaluate(element => element.parentElement.open);
  await page.keyboard.press('Enter');
  assert.equal(await summary.evaluate(element => element.parentElement.open), !wasOpen, 'Enter toggles experience details');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !planet.panel.isOpen);

  await page.locator('[data-intro="journal"]').click();
  await page.locator('[data-read="galerie"]').click();
  await page.locator('.photo-tile').first().click();
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => planet.panel.lightbox.isOpen), false, 'Escape closes lightbox');
  assert.equal(await page.evaluate(() => planet.panel.isOpen), true, 'Escape preserves underlying panel');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !planet.panel.isOpen);

  await page.locator('[data-intro="land"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => planet.mode === 'play');
  assert.equal(await page.locator('[data-action="settings"]').isVisible(), true, 'settings button is available');
  assert.equal(await page.evaluate(() => {
    const place = planet.world.layout.places.find(item => item.beacon);
    planet.hud.setObjective({ place, distance: 20, screenAngle: 0 });
    const arrow = document.querySelector('.objective-arrow');
    planet.hud.setObjective({ place, distance: 21, screenAngle: 1 });
    return arrow === document.querySelector('.objective-arrow');
  }), true, 'objective rotation and distance preserve the arrow node');

  await page.keyboard.press('m');
  await page.waitForFunction(() => planet.mode === 'map' && planet.rig.mode === 'orbit');
  await page.waitForFunction(() => document.querySelectorAll('.world-label:not([hidden])').length > 0);
  assert.equal(await page.locator('.speech').isVisible(), false, 'map hides guide speech');
  assert.equal(await page.evaluate(() => [...document.querySelectorAll('.world-label[hidden]')].every(element => element.tabIndex === -1)), true, 'occluded labels are not tab stops');
  assert.ok(await page.locator('.world-label:not([hidden])').count() > 0, 'map retains visible destinations');

  await page.evaluate(() => planet.finale.show());
  await page.locator('[data-finale="close"]').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.finale), 'contact', 'finale traps keyboard focus');
  assert.equal(await page.evaluate(() => { planet.finale.hide(); return planet.finale.isOpen; }), false, 'finale closes synchronously');

  await page.setViewportSize({ width: 844, height: 390 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.planet?.mode === 'intro');
  const landing = page.locator('[data-intro="land"]');
  await landing.scrollIntoViewIfNeeded();
  const box = await landing.boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 390, 'landscape arrival action can scroll into view');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'landscape has no horizontal overflow');

  const fallback = await browser.newPage();
  fallback.on('pageerror', error => errors.push(error.message));
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type === 'webgl2' ? null : getContext.call(this, type, ...args);
    };
  });
  await fallback.goto(url, { waitUntil: 'networkidle' });
  await fallback.locator('[data-read="galerie"]').click();
  await fallback.locator('.photo-tile').first().click();
  await fallback.keyboard.press('Escape');
  assert.equal(await fallback.locator('.lightbox').isVisible(), false, 'fallback Escape closes lightbox');
  assert.equal(await fallback.locator('.panel').isVisible(), true, 'fallback Escape preserves panel');
  await fallback.keyboard.press('Escape');
  assert.equal(await fallback.locator('.journal').isVisible(), true, 'fallback Escape returns to journal');
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log('PASS: 18 UI regressions (keyboard, modal layering, labels, HUD updates, landscape, WebGL fallback).');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
