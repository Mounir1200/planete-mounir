const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Other builders may be saved concurrently: keep this inspection on one snapshot.
  await page.routeWebSocket('**', () => {});
  await page.goto('http://127.0.0.1:5180/?debug=1', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.planet?.mode === 'intro');
  console.log('Ready');
  for (const id of ['essca', 'esaip', 'moov', 'rwu', 'ktu', 'gym']) {
    await page.locator('[data-intro="journal"]').click();
    await page.locator(`[data-read="${id}"]`).click();
    const logo = page.locator('.panel-brand img');
    await logo.evaluate(image => image.decode());
    assert.ok(await logo.evaluate(image => image.naturalWidth > 0));
    assert.ok((await logo.getAttribute('alt')).length > 4);
    await page.waitForFunction(() => [...document.querySelectorAll('.panel img')]
      .filter(image => image.getBoundingClientRect().top < innerHeight)
      .every(image => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: `qa/screenshots/brand-panel-${id}.png` });
    await page.keyboard.press('Escape');
    console.log(`Brand verified: ${id}`);
  }
  await page.locator('[data-intro="journal"]').click();
  await page.locator('[data-travel="esaip"]').click();
  await page.waitForFunction(() => planet.mode === 'play');
  await page.evaluate(() => {
    const entry = planet.world.landmarks.entry('esaip');
    planet.world.dayCycle.angle = Math.atan2(entry.place.direction.x, entry.place.direction.z) + 0.3;
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'qa/screenshots/esaip-real-gameplay.png' });
  await page.keyboard.press('e');
  await page.waitForFunction(() => planet.panel.isOpen);
  assert.equal(await page.evaluate(() => planet.panel.place.id), 'esaip');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !planet.panel.isOpen && planet.mode === 'play');
  const logoPage = await browser.newPage({ viewport: { width: 720, height: 300 } });
  await logoPage.goto('http://127.0.0.1:5180/brands/basic-fit-orange.svg');
  await logoPage.evaluate(() => {
    document.documentElement.style.background = '#222';
    document.documentElement.style.width = '620px';
    document.documentElement.style.height = '184px';
  });
  await logoPage.screenshot({ path: 'qa/screenshots/brand-basicfit.png' });
  await logoPage.goto('http://127.0.0.1:5180/brands/ktu.svg');
  await logoPage.evaluate(() => {
    document.documentElement.style.width = '520px';
    document.documentElement.style.height = '288px';
  });
  await logoPage.screenshot({ path: 'qa/screenshots/brand-ktu.png' });
  console.log(JSON.stringify({ brandPanels: 6, gameplay: true, enterReadAndReturn: true, errors }));
  await browser.close();
  if (errors.length) process.exit(1);
})().catch(error => { console.error(error); process.exit(1); });
