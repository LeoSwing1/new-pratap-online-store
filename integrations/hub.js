/* New Pratap Tools — Integration Hub
   Demo-safe orchestration layer. Provider secrets belong on a secure server.
   Each connector exposes the same event contract so the UI can run in demo mode
   and production adapters can be swapped in without changing checkout/admin UX.
*/
(function(){
  const KEY='npt_integration_hub_v1';
  const connectors=[
    {id:'supabase',name:'Supabase / PostgreSQL',phase:1,group:'Backend',icon:'DB',desc:'Products, customers, orders, addresses and commerce data',events:['data.sync','order.created','stock.updated']},
    {id:'auth',name:'Customer Authentication',phase:1,group:'Identity',icon:'ID',desc:'OTP, email and guest-to-account identity flows',events:['auth.signup','auth.login']},
    {id:'realtime',name:'Realtime Sync',phase:1,group:'Backend',icon:'RT',desc:'Instant admin/store updates for orders, stock and notifications',events:['realtime.publish']},
    {id:'storage',name:'Cloud Storage',phase:1,group:'Media',icon:'IMG',desc:'Product photos, banners, invoices and business assets',events:['asset.upload']},
    {id:'payment',name:'Payment Gateway',phase:2,group:'Payments',icon:'₹',desc:'UPI, cards, net banking and wallets',events:['payment.create','payment.success','payment.failed']},
    {id:'webhooks',name:'Payment Verification & Webhooks',phase:2,group:'Payments',icon:'WH',desc:'Server-side verification, refunds and payment status events',events:['payment.webhook','refund.create']},
    {id:'courier',name:'Courier & Shipment',phase:3,group:'Delivery',icon:'PK',desc:'Shipment creation, courier allocation and rates',events:['shipment.create','shipment.cancel']},
    {id:'tracking',name:'AWB & Live Tracking',phase:3,group:'Delivery',icon:'TR',desc:'AWB, tracking timeline and delivery status',events:['tracking.sync','awb.created']},
    {id:'whatsapp',name:'WhatsApp Business',phase:4,group:'Messaging',icon:'WA',desc:'Order confirmations, shipment alerts and support',events:['whatsapp.send']},
    {id:'email',name:'Transactional Email',phase:4,group:'Messaging',icon:'@',desc:'Orders, invoices, refunds and account emails',events:['email.send']},
    {id:'sms',name:'SMS / OTP',phase:4,group:'Messaging',icon:'SMS',desc:'Login OTP and critical order notifications',events:['sms.send','otp.send']},
    {id:'push',name:'Browser Push / FCM',phase:4,group:'Messaging',icon:'PUSH',desc:'Back-in-stock, shipping and promotional push notifications',events:['push.send']},
    {id:'invoice',name:'Invoice & GST',phase:5,group:'Finance',icon:'INV',desc:'Invoice numbering, tax details and PDF generation',events:['invoice.create']},
    {id:'analytics',name:'Analytics',phase:5,group:'Growth',icon:'AN',desc:'Traffic, product views, checkout and conversion events',events:['analytics.event']},
    {id:'merchant',name:'Google Merchant / Shopping',phase:5,group:'Growth',icon:'G',desc:'Product feed, price and availability publishing',events:['merchant.sync']},
    {id:'support',name:'Support & Smart Assistant',phase:5,group:'Experience',icon:'AI',desc:'Order lookup, product help and WhatsApp handoff',events:['support.message','support.order_lookup']},
    {id:'maps',name:'Google Maps & Address Intelligence',phase:6,group:'Location',icon:'MAP',desc:'Address autocomplete, map pin, pincode and delivery location',events:['address.validate','map.pin']},
    {id:'reviews',name:'Reviews & Ratings',phase:6,group:'Trust',icon:'★',desc:'Customer ratings, reviews, photos, moderation and replies',events:['review.created','review.moderate']},
    {id:'search',name:'Advanced Search & Smart Filters',phase:6,group:'Discovery',icon:'Q',desc:'Fast product search, filters, price ranges and intent-aware discovery',events:['search.query','filter.apply']},
    {id:'supplier',name:'Supplier & Purchase Management',phase:6,group:'Operations',icon:'SUP',desc:'Suppliers, purchase orders, goods received and stock intake',events:['purchase.created','stock.received']},
    {id:'accounting',name:'Accounting Integration',phase:6,group:'Finance',icon:'ACC',desc:'Orders, invoices, taxes and ledger sync with accounting systems',events:['accounting.sync','ledger.post']},
    {id:'catalog',name:'WhatsApp Product Catalogue',phase:6,group:'Commerce',icon:'CAT',desc:'Publish selected products and prices to WhatsApp catalogue',events:['catalog.sync','catalog.publish']},
    {id:'abandoned',name:'Abandoned Cart Recovery',phase:6,group:'Retention',icon:'CART',desc:'Recover incomplete carts through approved customer channels',events:['cart.abandoned','cart.recover']},
    {id:'meta',name:'Meta Ads & Conversion Tracking',phase:6,group:'Marketing',icon:'META',desc:'Meta Pixel, conversion events and campaign attribution',events:['meta.view','meta.purchase']},
    {id:'googleads',name:'Google Ads Conversion Tracking',phase:6,group:'Marketing',icon:'ADS',desc:'Purchase, checkout and campaign conversion measurement',events:['ads.checkout','ads.purchase']},
    {id:'security',name:'Security & Monitoring',phase:6,group:'Security',icon:'SEC',desc:'Error monitoring, audit events, webhook failures and security alerts',events:['security.alert','error.report']},
    {id:'backup',name:'Automated Backups & Recovery',phase:6,group:'Resilience',icon:'BKP',desc:'Scheduled backups, restore checkpoints and recovery readiness',events:['backup.run','backup.restore']},
    {id:'crm',name:'CRM & Customer Intelligence',phase:6,group:'CRM',icon:'CRM',desc:'Customer profiles, lifetime value, segmentation and follow-up',events:['crm.sync','customer.segment']},
    {id:'live-support',name:'Live Human Support',phase:6,group:'Support',icon:'LIVE',desc:'Support inbox, agent handoff and customer conversations',events:['support.ticket','support.assign']},
    {id:'warehouse',name:'Multi-Store & Warehouse',phase:6,group:'Operations',icon:'WH',desc:'Multiple locations, inventory pools, fulfillment and transfers',events:['warehouse.sync','inventory.transfer']}
  ];
  const providers={
    payment:['Razorpay','Cashfree Payments','PhonePe','PayU'],
    courier:['Shiprocket','Delhivery','DTDC','Blue Dart','XpressBees'],
    email:['Resend','SendGrid','SMTP'],
    sms:['MSG91','Twilio'],
    push:['Firebase Cloud Messaging'],
    whatsapp:['WhatsApp Business Cloud API'],
    maps:['Google Maps Platform'],
    accounting:['TallyPrime','Zoho Books','QuickBooks'],
    meta:['Meta Pixel + Conversions API'],
    googleads:['Google Ads'],
    monitoring:['Sentry','OpenTelemetry'],
    crm:['Zoho CRM','HubSpot'],
    support:['Freshdesk','Intercom'],
    warehouse:['Custom Multi-Warehouse API']
  };
  function read(){try{return JSON.parse(localStorage.getItem(KEY))||{mode:'demo',enabled:{},logs:[],lastTest:{}}}catch(e){return{mode:'demo',enabled:{},logs:[],lastTest:{}}}}
  function write(s){localStorage.setItem(KEY,JSON.stringify(s))}
  function stamp(){return new Date().toISOString()}
  function emit(event,payload={}){const s=read();s.logs.unshift({id:'evt-'+Date.now()+Math.random().toString(16).slice(2),event,payload,time:stamp(),mode:s.mode});s.logs=s.logs.slice(0,80);write(s);return true}
  function test(id){const c=connectors.find(x=>x.id===id);if(!c)return false;const s=read();s.enabled[id]=true;s.lastTest[id]=stamp();s.logs.unshift({id:'test-'+Date.now(),event:'connector.test',connector:id,label:c.name,time:stamp(),mode:s.mode,status:'success'});s.logs=s.logs.slice(0,80);write(s);return true}
  function setMode(mode){const s=read();s.mode=mode;write(s)}
  function isReady(id){const s=read();return !!s.enabled[id]}
  function adminHeaders(extra={}){const t=sessionStorage.getItem('npt_admin_token')||'';return Object.assign({'content-type':'application/json',...(t?{'authorization':'Bearer '+t}: {})},extra)}
  async function serverStatus(){try{const r=await fetch((window.NPT_API_BASE||'')+'/api/integrations/status');return await r.json()}catch(e){return {ok:false,configured:{},error:'Backend unavailable'}}}
  async function adminLogin(email,password){const r=await fetch((window.NPT_API_BASE||'')+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});return await r.json()}
  async function unlockPanel(password){const r=await fetch((window.NPT_API_BASE||'')+'/api/integrations/unlock',{method:'POST',headers:adminHeaders(),body:JSON.stringify({password})});const d=await r.json();if(d.ok)sessionStorage.setItem('npt_integration_token',d.token);return d}
  function isUnlocked(){return !!sessionStorage.getItem('npt_integration_token')}
  function clearUnlock(){sessionStorage.removeItem('npt_integration_token')}
  async function saveCredentials(id,values){const r=await fetch((window.NPT_API_BASE||'')+'/api/integrations/config',{method:'POST',headers:adminHeaders({'x-integration-token':sessionStorage.getItem('npt_integration_token')||''}),body:JSON.stringify({id,values})});return await r.json()}
  async function testServer(id){const r=await fetch((window.NPT_API_BASE||'')+'/api/integrations/test',{method:'POST',headers:adminHeaders({'x-integration-token':sessionStorage.getItem('npt_integration_token')||''}),body:JSON.stringify({id})});return await r.json()}
  function state(){return read()}
  function connector(id){return connectors.find(x=>x.id===id)}
  window.IntegrationHub={connectors,providers,emit,test,setMode,isReady,state,connector,serverStatus,saveCredentials,testServer,adminLogin,unlockPanel,isUnlocked,clearUnlock};
})();
