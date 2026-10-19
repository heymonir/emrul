// Run with Playwright installed: npm install --no-save playwright
// EMRUL_TEST_URL=http://127.0.0.1:8000 node tests/browser.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox']});
try {
const context=await browser.newContext({viewport:{width:393,height:852},serviceWorkers:'allow'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.EMRUL_TEST_URL||'http://127.0.0.1:8000');await page.evaluate(()=>document.fonts.ready);
await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
for(const count of [1,12,50,70,200,1000]){
 const result=await page.evaluate(count=>{
  const items=Array.from({length:count},(_,i)=>({nm:'পণ্য '+(i+1)+' ইলেকট্রনিক্স লম্বা নাম',qty:2,prc:10,tot:20}));
  const receipt=ReceiptPrinter.build({id:'INV-001',cn:'কাস্টমার',cp:'01700000000',ca:'বাংলাদেশ',date:'2026-10-19',items,sub:count*20,grand:count*20,note:'শেষের নোট '.repeat(20)});
  let height=0,blackBands=0;
  for(const f of receipt.frames.slice(1,-1)){
    if(f[0]!==29||f[1]!==118||f[6]>64||f.length!==8+48*f[6])throw Error('bad raster frame');
    height+=f[6];if(f.slice(8).some(v=>v))blackBands++;
  }
  return {height,expected:receipt.height,previewHeight:receipt.preview.height,bands:receipt.frames.length-2,blackBands};
 },count);
 assert.equal(result.height,result.expected);assert.ok(result.previewHeight<=1600);assert.ok(result.blackBands>0);
 console.log(count+' items:',JSON.stringify(result));
}
await page.evaluate(()=>{
 document.querySelector('.pn').value='মোটর';document.querySelector('.qty').value='2';document.querySelector('.prc').value='100';calc();
 if(collect().grand!==200)throw Error('total changed');
 saveInv(collect());
});
await context.setOffline(true);await page.reload();
assert.equal(await page.locator('h1').first().textContent(),'ইমরুল ইলেকট্রনিক্স');
await page.evaluate(()=>document.fonts.ready);
assert.equal(await page.evaluate(()=>DB[0].items[0].nm),'মোটর');
assert.equal(await page.evaluate(()=>document.fonts.check('22px "Tiro Bangla"','বাংলা')),true);
console.log('Offline reload, Bengali font, and history persistence passed');
assert.deepEqual(errors,[]);
await context.close();
const native=await browser.newContext();
await native.addInitScript(()=>{
 window.nativeBytes=0;window.failWrite=false;
 window.AndroidPrinter={
 connect:id=>setTimeout(()=>window.nativePrinterResult(id,null,'HOIN test'),0),
 disconnect:id=>setTimeout(()=>window.nativePrinterResult(id,null,''),0),
 write:(id,data)=>{window.nativeBytes+=atob(data).length;setTimeout(()=>window.nativePrinterResult(id,window.failWrite?'Disconnected':null,''),0);}
 };
});
const app=await native.newPage();app.on('pageerror',e=>errors.push(e.message));
await app.goto(process.env.EMRUL_TEST_URL||'http://127.0.0.1:8000');
await app.evaluate(async()=>{
 await connectBT();
 document.querySelector('.pn').value='পরীক্ষা';document.querySelector('.prc').value='100';
 const original=ReceiptPrinter.send;ReceiptPrinter.send=(c,f,p)=>original(c,f,p,async()=>{});
 await printInvoice();
});
assert.ok(await app.locator('#modMsg canvas').count());
await app.getByRole('button',{name:'🖨️ প্রিন্ট চালু করুন'}).click();
await app.waitForFunction(()=>document.getElementById('modTitle').textContent==='ডেটা পাঠানো শেষ');
assert.ok(await app.evaluate(()=>window.nativeBytes>1000));
console.log('Native bridge connect, raster preview and complete mocked print passed');
await app.evaluate(async()=>{closeModal();window.failWrite=true;await printInvoice();});
await app.getByRole('button',{name:'🖨️ প্রিন্ট চালু করুন'}).click();
await app.waitForFunction(()=>document.getElementById('modTitle').textContent==='প্রিন্ট থেমে গেছে');
assert.deepEqual(errors,[]);
console.log('Print error is caught and reported; no unhandled promise rejection');
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
