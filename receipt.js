/* Bounded ESC/POS raster bands: no printer-sized or browser-sized long image. */
(function(root){
'use strict';
const WIDTH=384, BAND=64;
function rasterBand(image,width,height){
  const stride=Math.ceil(width/8), out=new Uint8Array(8+stride*height);
  out.set([29,118,48,0,stride&255,stride>>8,height&255,height>>8]);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const i=(y*width+x)*4;
    if(image[i+3] && .299*image[i]+.587*image[i+1]+.114*image[i+2]<127)
      out[8+y*stride+(x>>3)]|=128>>(x%8);
  }
  return out;
}
function build(d){
  const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=BAND;
  const ctx=canvas.getContext('2d'), ops=[];let y=10;
  const money=n=>Number(n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  function text(value,font='22px "Tiro Bangla"',align='left',x=10){
    ops.push({value:String(value),font,align,x,y});
  }
  function lines(value,width=364,font='22px "Tiro Bangla"'){
    ctx.font=font;const result=[];
    for(const paragraph of String(value).split('\n')){
      let line='';
      const chars=typeof Intl.Segmenter==='function'
        ? Array.from(new Intl.Segmenter('bn',{granularity:'grapheme'}).segment(paragraph),s=>s.segment)
        : Array.from(paragraph);
      for(const ch of chars){
        if(line && ctx.measureText(line+ch).width>width){result.push(line);line='';}
        line+=ch;
      }
      result.push(line);
    }
    return result;
  }
  function wrapped(value){for(const line of lines(value)){text(line);y+=30;}}
  text('ইমরুল ইলেকট্রনিক্স','bold 42px "Tiro Bangla"','center',192);y+=52;
  text('Tel: 01730484884','24px "Tiro Bangla"','center',192);y+=32;
  for(const line of lines(d.id||'')){text(line,'24px "Tiro Bangla"','center',192);y+=32;}
  y+=14;wrapped('Date: '+(d.date||''));wrapped('Customer: '+(d.cn||''));
  if(d.cp) wrapped('Phone: '+d.cp);
  if(d.ca) wrapped('Addr: '+d.ca);
  text('Item','bold 26px "Tiro Bangla"');text('Amount','bold 26px "Tiro Bangla"','right',374);y+=36;
  ops.push({rule:true,y});y+=10;
  (d.items||[]).forEach((it,i)=>{
    // All collected items are retained, including zero-priced items.
    wrapped((i+1)+'. '+(it.nm||'-'));
    text('(x'+it.qty+')','20px "Tiro Bangla"');
    text('৳ '+money(it.tot),'22px "Tiro Bangla"','right',374);y+=34;
  });
  function total(label,value,font='bold 26px "Tiro Bangla"'){
    text(label,font);text('৳ '+money(value),font,'right',374);y+=36;
  }
  total('Sub-total:',d.sub);if(d.disc>0)total('Discount:',d.disc);
  total('TOTAL:',d.grand,'bold 28px "Tiro Bangla"');
  if(d.note){wrapped('Note:');wrapped(d.note);}
  y+=14;text('ধন্যবাদ!','bold 28px "Tiro Bangla"','center',192);y+=34;
  text('আবার আসবেন','24px "Tiro Bangla"','center',192);y+=40;
  const height=y, frames=[new Uint8Array([27,64,27,97,0])];
  const preview=document.createElement('canvas');preview.width=WIDTH;preview.height=Math.min(height,1600);
  const pc=preview.getContext('2d');pc.fillStyle='#fff';pc.fillRect(0,0,WIDTH,preview.height);
  let cursor=0, active=[];
  for(let top=0;top<height;top+=BAND){
    const h=Math.min(BAND,height-top);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,WIDTH,BAND);ctx.fillStyle='#000';ctx.textBaseline='top';
    active=active.filter(op=>op.y+64>top);
    while(cursor<ops.length && ops[cursor].y<top+h)active.push(ops[cursor++]);
    for(const op of active){
      if(op.rule){ctx.fillRect(10,op.y-top,364,2);continue;}
      ctx.font=op.font;ctx.textAlign=op.align;ctx.fillText(op.value,op.x,op.y-top);
    }
    frames.push(rasterBand(ctx.getImageData(0,0,WIDTH,h).data,WIDTH,h));
    if(top<preview.height)pc.drawImage(canvas,0,top);
  }
  frames.push(new Uint8Array([10,10,10,29,86,66,0]));
  return {frames,preview,height};
}
async function send(char,frames,onProgress,wait=ms=>new Promise(r=>setTimeout(r,ms))){
  const total=frames.reduce((n,f)=>n+f.length,0);let sent=0;
  // A 20-byte payload also works with the minimum BLE ATT MTU.
  for(const frame of frames){
    const chunkSize=char.transport==='classic'?256:20;
    for(let offset=0;offset<frame.length;offset+=chunkSize){
      const chunk=frame.slice(offset,offset+chunkSize);
      if(char.properties.write && char.writeValueWithResponse)await char.writeValueWithResponse(chunk);
      else if(char.properties.writeWithoutResponse)await char.writeValueWithoutResponse(chunk);
      else await char.writeValue(chunk);
      // Never retry an uncertain write: the printer may already have consumed it.
      sent+=chunk.length;await wait(12);
      if(onProgress)onProgress(Math.min(100,Math.floor(sent/total*100)));
    }
    if(frame[0]===29 && frame[1]===118)await wait(350);
  }
}
root.ReceiptPrinter={build,send,rasterBand,BAND,WIDTH};
if(typeof module!=='undefined')module.exports=root.ReceiptPrinter;
})(globalThis);
