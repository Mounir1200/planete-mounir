const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = process.env.PLANET_URL || 'http://127.0.0.1:5180/';
async function ready(page) {
  await page.goto(`${url}?debug=1`,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.planet?.mode==='intro');
}
(async()=>{
  fs.mkdirSync('qa/screenshots',{recursive:true});
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:900},locale:'fr-FR',reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  try {
    await ready(page);
    await page.screenshot({path:'qa/screenshots/final-intro.png'});
    await page.locator('[data-intro="land"]').focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>planet.mode==='play');
    await page.locator('.world-canvas').focus();
    assert.equal(await page.evaluate(()=>planet.player.physics.backend),'rust-wasm','The live player uses the Rust/WebAssembly backend');
    const physicsBefore=await page.evaluate(()=>({steps:planet.player.physics.steps,position:planet.player.position.toArray()}));
    await page.keyboard.down('ArrowUp');
    await page.waitForFunction(before=>planet.player.physics.steps>before.steps+3&&planet.player.position.distanceTo(planet.player.position.clone().fromArray(before.position))>0.02,physicsBefore);
    await page.keyboard.up('ArrowUp');
    await page.keyboard.press('Escape');
    assert(await page.locator('.settings').isVisible(),'Escape opens pause');
    const pausedTime=await page.evaluate(()=>planet.time);
    const pausedSteps=await page.evaluate(()=>planet.player.physics.steps);
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(()=>planet.time),pausedTime,'Pause stops simulation');
    assert.equal(await page.evaluate(()=>planet.player.physics.steps),pausedSteps,'Pause also stops the Rust physics calls');
    await page.locator('[data-setting="quality"]').selectOption('low');
    assert.equal(await page.evaluate(()=>planet.renderer.bloom.enabled),false);
    await page.locator('[data-setting="quality"]').selectOption('high');
    assert.equal(await page.evaluate(()=>planet.renderer.bloom.enabled),true);
    await page.locator('[data-setting="quietHud"]').check();
    assert.equal(await page.locator('.hud-left').isVisible(),false);
    await page.locator('[data-setting="soundOn"]').check();
    await page.waitForFunction(()=>planet.audio.isEnabled);
    await page.locator('[data-setting="soundOn"]').uncheck();
    await page.screenshot({path:'qa/screenshots/final-settings.png'});
    await page.locator('[data-setting="quality"]').focus();await page.keyboard.press('Escape');
    assert.equal(await page.locator('.settings').isVisible(),false,'Escape works from select');
    for(const id of ['essca','urdwell','hindsight','phare','port']) {
      await page.locator('.world-canvas').focus();await page.keyboard.press('j');
      await page.locator(`[data-travel="${id}"]`).click();
      await page.waitForFunction(()=>planet.mode==='play'&&!planet.rig.isFlying);
      const camera=await page.evaluate(()=>({height:planet.camera.position.length(),ground:planet.world.terrain.heightAt(planet.camera.position.clone().normalize())}));
      assert(camera.height>=camera.ground,'Camera stays above the destination terrain');
      await page.locator('.world-canvas').focus();await page.keyboard.press('j');
      await page.locator(`[data-read="${id}"]`).click();
      await page.locator('.panel.is-open').waitFor({state:'visible'});
      await page.keyboard.press('Escape');
    }
    await page.waitForFunction(()=>planet.finale.isOpen);
    assert.equal(await page.evaluate(()=>planet.progress.visited.size),5);
    await page.locator('[data-finale="close"]').click();
    await page.waitForFunction(()=>planet.mode==='play');
    await page.locator('.world-canvas').focus();await page.keyboard.press('m');
    await page.waitForFunction(()=>planet.mode==='map'&&planet.rig.mode==='orbit');
    assert.equal(await page.locator('.speech').isVisible(),false);
    await page.screenshot({path:'qa/screenshots/final-map.png'});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>planet.mode==='play');
    await page.screenshot({path:'qa/screenshots/final-ground.png'});
    await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>window.planet?.mode==='intro');
    assert.equal(await page.evaluate(()=>planet.progress.quietHud),true,'Preference persists');
    assert.equal(await page.evaluate(()=>planet.progress.visited.size),5,'Discovery persists');
    console.log('Desktop: live Rust/Wasm movement, pause, display quality, minimal interface, sound, five journeys, finale and persistence PASS');

    const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'fr-FR',reducedMotion:'reduce'});
    mobile.on('pageerror',e=>errors.push(e.message));await ready(mobile);
    await mobile.locator('[data-intro="land"]').tap();await mobile.waitForFunction(()=>planet.mode==='play');
    assert(await mobile.locator('.joystick').isVisible());
    await mobile.evaluate(()=>{planet.events.on('jump',()=>window.didJump=true);});
    await mobile.locator('.touch-jump').tap();await mobile.waitForFunction(()=>window.didJump);
    await mobile.screenshot({path:'qa/screenshots/final-mobile.png'});
    await mobile.locator('[data-action="settings"]').tap();
    await mobile.screenshot({path:'qa/screenshots/final-mobile-settings.png'});
    assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.equal(await mobile.locator('.settings-sheet').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    console.log('Mobile: real touch jump, controls, pause and no overflow PASS');
    assert.deepEqual(errors,[]);console.log('No runtime errors');
    await mobile.close();
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
