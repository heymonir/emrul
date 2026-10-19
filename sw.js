const CACHE='emrul-offline-v2';
const ASSETS=["./", "./index.html", "./receipt.js", "./manifest.json", "./icon-192.png", "./icon-512.png", "./fonts/fonts.css", "./fonts/hind-siliguri-bengali-500-normal.woff2", "./fonts/hind-siliguri-latin-600-normal.woff2", "./fonts/hind-siliguri-bengali-600-normal.woff2", "./fonts/hind-siliguri-bengali-400-normal.woff2", "./fonts/hind-siliguri-bengali-700-normal.woff2", "./fonts/tiro-bangla-latin-400-normal.woff2", "./fonts/tiro-bangla-bengali-400-normal.woff2", "./fonts/hind-siliguri-latin-700-normal.woff2", "./fonts/hind-siliguri-latin-500-normal.woff2", "./fonts/hind-siliguri-latin-400-normal.woff2"];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('emrul-offline-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(error=>{
    if(event.request.mode==='navigate')return caches.match('./index.html');
    throw error;
  })));
});
