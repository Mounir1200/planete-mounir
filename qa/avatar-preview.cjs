const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-unsafe-swiftshader']});
try{const page=await browser.newPage({viewport:{width:1000,height:1100}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5180/qa/avatar-preview.html',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.stage);
for(const name of ['front','three-quarter','rear','portrait','portrait-three-quarter','profile']){await page.evaluate(name=>stage.view(name),name);await page.screenshot({path:`qa/screenshots/avatar-natural-${name}.png`});}
assert.deepEqual(errors,[]);console.log('Avatar: four studio views, no render errors');}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
