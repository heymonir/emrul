const {test}=require('node:test');
const assert=require('node:assert/strict');
const {rasterBand,send}=require('../receipt.js');
test('raster header, row alignment and pixel packing',()=>{
  const image=new Uint8ClampedArray(16*2*4).fill(255);
  for(const p of [0,7,8,31])image.set([0,0,0,255],p*4);
  const out=rasterBand(image,16,2);
  assert.deepEqual([...out],[29,118,48,0,2,0,2,0,129,128,0,1]);
});
test('long BLE job preserves every byte, order, MTU, pacing and final feed',async()=>{
  const frames=Array.from({length:100},()=>new Uint8Array([29,118,48,0,48,0,64,0,...new Uint8Array(3072).fill(85)]));
  frames.push(new Uint8Array([10,10,10,29,86,66,0]));
  const received=[],pauses=[],progress=[];
  await send({properties:{write:true,writeWithoutResponse:true},writeValueWithResponse:async b=>{assert.ok(b.length<=20);received.push(...b);},writeValueWithoutResponse:()=>assert.fail('prefer acknowledged write')},frames,p=>progress.push(p),async n=>pauses.push(n));
  assert.deepEqual(received,Array.from(Buffer.concat(frames)));
  assert.equal(pauses.filter(n=>n===350).length,100);
  assert.equal(progress.at(-1),100);assert.ok(progress.every(p=>p>=0&&p<=100));
});
test('uncertain failed writes abort without resending duplicate bytes',async()=>{
  let count=0;
  await assert.rejects(send({properties:{writeWithoutResponse:true},writeValueWithoutResponse:async()=>{count++;throw Error('Disconnected');}},[new Uint8Array(50)],null,async()=>{}),/Disconnected/);
  assert.equal(count,1);
});
