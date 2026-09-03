importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');
async function boot(){try{const r=await fetch('/api/push/config',{cache:'no-store'});const d=await r.json();if(!d.configured)return;firebase.initializeApp(d.config);const messaging=firebase.messaging();messaging.onBackgroundMessage(payload=>{const n=payload.notification||{};self.registration.showNotification(n.title||'New Pratap Tools',{body:n.body||'',data:{url:payload.fcmOptions?.link||payload.data?.url||'/'}})});}catch(e){}}
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',event=>{event.notification.close();const url=event.notification?.data?.url||'/';event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c){return c.navigate(url).then(()=>c.focus())}}return clients.openWindow(url)}));});
boot();
