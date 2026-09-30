// 박스 ERP 서비스워커 — 앱 셸 오프라인 캐시 (데이터는 Firebase/localStorage가 담당)
const VERSION='box-erp-v9';
const CDN_HOSTS=['cdnjs.cloudflare.com','www.gstatic.com'];
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  // Firebase 실시간 DB/인증 통신은 건드리지 않음
  if(/firebaseio\.com|googleapis\.com|firebaseapp\.com|identitytoolkit|securetoken/.test(url.hostname)) return;
  // 앱 페이지(네비게이션): 네트워크 우선, 실패 시 캐시 (오프라인)
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); return res; }).catch(()=>caches.match(req).then(r=>r||caches.match('./')||caches.match('./index.html'))));
    return;
  }
  // 같은 출처 정적 파일 + CDN 라이브러리: 캐시 우선, 없으면 네트워크 후 캐시
  if(url.origin===self.location.origin||CDN_HOSTS.includes(url.hostname)){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{ if(res&&res.ok){ const copy=res.clone(); caches.open(VERSION).then(c=>c.put(req,copy)); } return res; })));
  }
});
