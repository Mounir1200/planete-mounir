const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await page.routeWebSocket('**',()=>{});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5180/?debug=1',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.planet?.mode==='intro');
  await page.locator('[data-intro="land"]').click();
  await page.waitForFunction(()=>planet.mode==='play');
  await page.evaluate(()=>{
    const entry=planet.world.landmarks.entry('maison');
    planet.world.dayCycle.angle=Math.atan2(entry.place.direction.x,entry.place.direction.z)+.3;
  });
  await page.waitForTimeout(500);
  await page.screenshot({path:'qa/screenshots/atelier-maison-gameplay.png'});
  await page.keyboard.press('e');
  await page.waitForFunction(()=>planet.panel.isOpen);
  assert.equal(await page.evaluate(()=>planet.panel.place.id),'maison');
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await page.locator('[data-travel="galerie"]').click();
  await page.waitForFunction(()=>planet.mode==='play'&&!planet.rig.isFlying);
  await page.evaluate(()=>{
    const entry=planet.world.landmarks.entry('galerie');
    planet.world.dayCycle.angle=Math.atan2(entry.place.direction.x,entry.place.direction.z)+.3;
  });
  await page.waitForTimeout(500);
  const photos=await page.evaluate(()=>{
    const result=[];
    planet.world.landmarks.entry('galerie').root.traverse(object=>{
      if(object.isMesh&&object.material.map?.image?.src?.includes('/photos/')) result.push({src:object.material.map.image.src,loaded:object.material.map.image.complete&&object.material.map.image.naturalWidth>0});
    });
    return result;
  });
  assert.equal(photos.length,5);
  assert.ok(photos.every(photo=>photo.loaded),'five real photos loaded in 3D');
  await page.screenshot({path:'qa/screenshots/atelier-galerie-gameplay.png'});
  await page.keyboard.press('e');
  await page.waitForFunction(()=>planet.panel.isOpen);
  assert.equal(await page.evaluate(()=>planet.panel.place.id),'galerie');
  await page.locator('.photo-tile').first().click();
  await page.waitForFunction(()=>planet.panel.lightbox.isOpen);
  await page.locator('.lightbox img').evaluate(image=>image.decode());
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>planet.panel.isOpen),true);
  await page.keyboard.press('Escape');
  await page.waitForFunction(()=>!planet.panel.isOpen);
  await page.evaluate(()=>{planet.rig.update=()=>{};planet.mode='inspect';planet.ui.style.display='none';});
  for(const id of ['maison','galerie'])for(const side of ['front','rear']){
    await page.evaluate(({id,side})=>{
      const entry=planet.world.landmarks.entry(id);
      planet.player.placeAt(entry.spawnPoint,entry.interactPoint);
      planet.world.dayCycle.angle=Math.atan2(entry.place.direction.x,entry.place.direction.z)+.3;
      planet.camera.position.set(...(side==='front'?[11,8,13]:[-11,8,-13])).applyMatrix4(entry.toWorld);
      planet.camera.up.copy(entry.place.direction);
      planet.camera.lookAt(planet.camera.position.clone().set(0,2,-.8).applyMatrix4(entry.toWorld));
    },{id,side});
    await page.waitForTimeout(120);
    await page.screenshot({path:`qa/screenshots/atelier-${id}-${side}.png`});
  }
  await browser.close();
  console.log(JSON.stringify({realPhotos:photos.length,houseEnter:true,galleryEnter:true,lightboxReturn:true,errors}));
  assert.deepEqual(errors,[]);
})().catch(error=>{console.error(error);process.exit(1);});
