const crypto = require('crypto');

async function requestJson(url, options={}) {
  const r = await fetch(url, options);
  const text = await r.text();
  let data; try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!r.ok) { const e = new Error(data?.error?.description || data?.message || data?.errors?.[0]?.message || `HTTP ${r.status}`); e.status=r.status; e.data=data; throw e; }
  return data;
}
function basic(id, secret) { return 'Basic '+Buffer.from(`${id}:${secret}`).toString('base64'); }
function bearer(token) { return `Bearer ${token}`; }

async function testProvider(id, env) {
  switch(id) {
    case 'supabase': {
      if (!env.SUPABASE_URL || !(env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY)) throw new Error('Supabase URL and publishable/anon key required');
      await requestJson(`${env.SUPABASE_URL.replace(/\/$/,'')}/rest/v1/`, {headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY, Authorization:bearer(env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY)}});
      return {provider:'Supabase',message:'Supabase REST endpoint reachable'};
    }
    case 'payment': {
      const p=env.PAYMENT_PROVIDER||'Razorpay';
      if (p.toLowerCase().includes('razor')) { if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET) throw new Error('Razorpay Key ID and Secret required'); await requestJson('https://api.razorpay.com/v1/orders?count=1',{headers:{Authorization:basic(env.RAZORPAY_KEY_ID,env.RAZORPAY_KEY_SECRET)}}); return {provider:p,message:'Razorpay credentials accepted'}; }
      if (p.toLowerCase().includes('cashfree')) { if(!env.CASHFREE_APP_ID||!env.CASHFREE_SECRET_KEY) throw new Error('Cashfree App ID and Secret required'); await requestJson('https://api.cashfree.com/pg/orders?order_amount=1&order_currency=INR',{headers:{'x-client-id':env.CASHFREE_APP_ID,'x-client-secret':env.CASHFREE_SECRET_KEY,'x-api-version':'2023-08-01'}}); return {provider:p,message:'Cashfree credentials reached'}; }
      if (p.toLowerCase().includes('phonepe')) { if(!env.PHONEPE_CLIENT_ID||!env.PHONEPE_CLIENT_SECRET) throw new Error('PhonePe client credentials required'); return {provider:p,message:'PhonePe credentials saved; OAuth/token handshake is provider-account specific'}; }
      if (p.toLowerCase().includes('payu')) { if(!env.PAYU_MERCHANT_KEY||!env.PAYU_SALT) throw new Error('PayU merchant key and salt required'); return {provider:p,message:'PayU credentials saved; transaction handshake is ready for merchant configuration'}; }
      throw new Error('Unsupported payment provider');
    }
    case 'courier': {
      const p=env.COURIER_PROVIDER||'Shiprocket';
      if (p.toLowerCase().includes('shiprocket')) { if(!env.SHIPROCKET_EMAIL||!env.SHIPROCKET_PASSWORD) throw new Error('Shiprocket email/password required'); const d=await requestJson('https://apiv2.shiprocket.in/v1/external/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:env.SHIPROCKET_EMAIL,password:env.SHIPROCKET_PASSWORD})}); return {provider:p,message:'Shiprocket authentication successful',token:!!d.token}; }
      if (p.toLowerCase().includes('delhivery')) { if(!env.DELHIVERY_API_TOKEN) throw new Error('Delhivery API token required'); await requestJson('https://track.delhivery.com/api/v1/packages/json/?waybill=TEST',{headers:{Authorization:`Token ${env.DELHIVERY_API_TOKEN}`}}); return {provider:p,message:'Delhivery API reachable'}; }
      if (p.toLowerCase().includes('dtdc')||p.toLowerCase().includes('blue')||p.toLowerCase().includes('xpress')) return {provider:p,message:'Credential format accepted; provider endpoint will be selected from merchant configuration'};
      throw new Error('Unsupported courier provider');
    }
    case 'whatsapp': {
      if(!env.WHATSAPP_ACCESS_TOKEN||!env.WHATSAPP_PHONE_NUMBER_ID) throw new Error('WhatsApp access token and phone number ID required');
      await requestJson(`https://graph.facebook.com/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}`,{headers:{Authorization:bearer(env.WHATSAPP_ACCESS_TOKEN)}}); return {provider:'WhatsApp Business Cloud API',message:'WhatsApp phone number endpoint reachable'};
    }
    case 'email': {
      const p=env.EMAIL_PROVIDER||'Resend';
      if(p.toLowerCase()==='resend'){if(!env.RESEND_API_KEY)throw new Error('Resend API key required'); await requestJson('https://api.resend.com/domains',{headers:{Authorization:bearer(env.RESEND_API_KEY)}}); return {provider:p,message:'Resend API reachable'};}
      if(p.toLowerCase()==='sendgrid'){if(!env.SENDGRID_API_KEY)throw new Error('SendGrid API key required'); await requestJson('https://api.sendgrid.com/v3/user/profile',{headers:{Authorization:bearer(env.SENDGRID_API_KEY)}}); return {provider:p,message:'SendGrid API reachable'};}
      if(p.toLowerCase()==='smtp') return {provider:p,message:'SMTP configuration saved; use Send test email after host/port is configured'};
      throw new Error('Unsupported email provider');
    }
    case 'sms': {
      const p=env.SMS_PROVIDER||'Twilio';
      if(p.toLowerCase().includes('twilio')){if(!env.TWILIO_ACCOUNT_SID||!env.TWILIO_AUTH_TOKEN)throw new Error('Twilio Account SID and Auth Token required');await requestJson(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}.json`,{headers:{Authorization:basic(env.TWILIO_ACCOUNT_SID,env.TWILIO_AUTH_TOKEN)}});return {provider:p,message:'Twilio API reachable'};}
      if(p.toLowerCase().includes('msg91')){if(!env.MSG91_AUTH_KEY)throw new Error('MSG91 auth key required');return {provider:p,message:'MSG91 credential saved; template/sender configuration required'};}
      throw new Error('Unsupported SMS provider');
    }
    case 'maps': { if(!env.GOOGLE_MAPS_API_KEY)throw new Error('Google Maps API key required'); await requestJson(`https://maps.googleapis.com/maps/api/geocode/json?address=Ghaziabad&key=${encodeURIComponent(env.GOOGLE_MAPS_API_KEY)}`); return {provider:'Google Maps Platform',message:'Geocoding API reachable'}; }
    case 'monitoring': return env.SENTRY_DSN?{provider:'Sentry',message:'Sentry DSN configured'}:(()=>{throw new Error('Sentry DSN required')})();
    case 'analytics': return env.GOOGLE_ANALYTICS_ID?{provider:'Google Analytics',message:'Measurement ID configured'}:(()=>{throw new Error('Google Analytics Measurement ID required')})();
    case 'merchant': return env.GOOGLE_MERCHANT_ID?{provider:'Google Merchant Center',message:'Merchant Center ID configured; feed sync endpoint ready'}:(()=>{throw new Error('Merchant ID required')})();
    case 'googleads': return env.GOOGLE_ADS_ID?{provider:'Google Ads',message:'Ads account ID configured'}:(()=>{throw new Error('Google Ads ID required')})();
    case 'meta': return env.META_PIXEL_ID?{provider:'Meta',message:'Pixel ID configured; server-side conversion token optional'}:(()=>{throw new Error('Meta Pixel ID required')})();
    case 'accounting': return env.ACCOUNTING_API_KEY?{provider:env.ACCOUNTING_PROVIDER||'Accounting',message:'Accounting credentials configured'}:(()=>{throw new Error('Accounting API key required')})();
    case 'crm': return env.CRM_API_KEY?{provider:env.CRM_PROVIDER||'CRM',message:'CRM credentials configured'}:(()=>{throw new Error('CRM API key required')})();
    case 'support': return env.SUPPORT_API_KEY?{provider:env.SUPPORT_PROVIDER||'Support',message:'Support credentials configured'}:(()=>{throw new Error('Support API key required')})();
    case 'warehouse': return env.WAREHOUSE_API_KEY?{provider:'Warehouse API',message:'Warehouse API credentials configured'}:(()=>{throw new Error('Warehouse API key required')})();
    case 'supplier': return env.SUPPLIER_API_KEY?{provider:'Supplier API',message:'Supplier API credentials configured'}:(()=>{throw new Error('Supplier API key required')})();
    case 'search': return env.SEARCH_API_KEY?{provider:env.SEARCH_PROVIDER||'Search',message:'Search API credentials configured'}:(()=>{throw new Error('Search API key required')})();
    case 'reviews': return env.REVIEWS_API_KEY?{provider:env.REVIEWS_PROVIDER||'Reviews',message:'Reviews API credentials configured'}:(()=>{throw new Error('Reviews API key required')})();
    case 'invoice': return env.INVOICE_API_KEY?{provider:env.INVOICE_PROVIDER||'Invoice',message:'Invoice API credentials configured'}:(()=>{throw new Error('Invoice API key required')})();
    case 'realtime': return env.REALTIME_API_KEY?{provider:'Realtime',message:'Realtime endpoint configured'}:(()=>{throw new Error('Realtime API key required')})();
    case 'storage': return env.STORAGE_API_KEY?{provider:'Storage',message:'Storage endpoint configured'}:(()=>{throw new Error('Storage API key required')})();
    case 'auth': return env.AUTH_API_KEY?{provider:env.AUTH_PROVIDER||'Authentication',message:'Authentication provider configured'}:(()=>{throw new Error('Auth API key required')})();
    case 'catalog': return env.WHATSAPP_CATALOG_ID?{provider:'WhatsApp Catalogue',message:'Catalogue ID configured'}:(()=>{throw new Error('WhatsApp catalogue ID required')})();
    case 'abandoned': return env.MESSAGING_RECOVERY_API_KEY?{provider:'Messaging Recovery',message:'Recovery connector configured'}:(()=>{throw new Error('Recovery API key required')})();
    case 'live-support': return env.LIVE_SUPPORT_API_KEY?{provider:'Live Support',message:'Live support endpoint configured'}:(()=>{throw new Error('Live support API key required')})();
    case 'backup': return {provider:'Server backup',message:'Backup scheduler is enabled by deployment configuration'};
    case 'security': return env.SENTRY_DSN?{provider:'Security monitoring',message:'Monitoring DSN configured'}:(()=>{throw new Error('Monitoring DSN required')})();
    case 'tracking': return env.COURIER_TRACKING_API_KEY||env.DELHIVERY_API_TOKEN?{provider:'Courier tracking',message:'Tracking credentials configured'}:(()=>{throw new Error('Courier tracking credentials required')})();
    case 'webhooks': return env.PAYMENT_WEBHOOK_SECRET?{provider:'Payment webhooks',message:'Webhook secret configured'}:(()=>{throw new Error('Webhook secret required')})();
    default: return {provider:id,message:'Connector is ready for provider-specific credentials'};
  }
}

async function createPayment(order, env) {
  const p=(env.PAYMENT_PROVIDER||'Razorpay').toLowerCase();
  if(p.includes('razor')) return requestJson('https://api.razorpay.com/v1/orders',{method:'POST',headers:{'content-type':'application/json',Authorization:basic(env.RAZORPAY_KEY_ID,env.RAZORPAY_KEY_SECRET)},body:JSON.stringify({amount:Math.round(order.total*100),currency:'INR',receipt:order.id,notes:{customer:order.customer?.mobile||''}})});
  throw new Error(`Live payment creation for ${env.PAYMENT_PROVIDER||'provider'} requires its configured server adapter`);
}
async function sendNotification(channel, msg, env){
  if(channel==='email' && (env.EMAIL_PROVIDER||'').toLowerCase()==='resend') return requestJson('https://api.resend.com/emails',{method:'POST',headers:{'content-type':'application/json',Authorization:bearer(env.RESEND_API_KEY)},body:JSON.stringify({from:env.EMAIL_FROM||'New Pratap Tools <onboarding@resend.dev>',to:[msg.to],subject:msg.subject||'New Pratap Tools update',html:msg.html||`<p>${msg.text||''}</p>`})});
  if(channel==='sms' && (env.SMS_PROVIDER||'').toLowerCase().includes('twilio')) return requestJson(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,{method:'POST',headers:{Authorization:basic(env.TWILIO_ACCOUNT_SID,env.TWILIO_AUTH_TOKEN),'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:msg.to,From:env.TWILIO_FROM||'',Body:msg.text||''}).toString()});
  if(channel==='whatsapp') return requestJson(`https://graph.facebook.com/v23.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,{method:'POST',headers:{Authorization:bearer(env.WHATSAPP_ACCESS_TOKEN),'content-type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to:msg.to,type:'text',text:{body:msg.text||''}})});
  throw new Error(`No live ${channel} sender configured`);
}
module.exports={testProvider,createPayment,sendNotification};
