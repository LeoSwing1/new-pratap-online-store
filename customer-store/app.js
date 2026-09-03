let S=NPT.load(),cart=JSON.parse(localStorage.getItem('npt_cart')||'[]'),currentCat='All Products',activePay='UPI',homeShowAll=false;
const PAGE_SIZE=8;
function save(){NPT.save(S);localStorage.setItem('npt_cart',JSON.stringify(cart));updateCart()}
async function syncLiveCatalog(render=true){try{const r=await fetch((window.NPT_API_BASE||'')+'/api/store/state',{cache:'no-store'});const d=await r.json();if(!d.ok||!Array.isArray(d.products))return false;const changed=JSON.stringify(S.products)!==JSON.stringify(d.products);S.products=d.products;if(Array.isArray(d.banners))S.banners=d.banners;save();if(changed){catNav();if(render||document.visibilityState==='visible')renderHome();}return true}catch(e){return false}}
async function refreshCustomerProfile(){const c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(!c)return;try{const qs=new URLSearchParams();if(c.mobile)qs.set('mobile',c.mobile);else if(c.email)qs.set('email',c.email);const r=await fetch((window.NPT_API_BASE||'')+'/api/store/customer?'+qs.toString(),{cache:'no-store'});const d=await r.json();if(d.ok&&d.customer){localStorage.setItem('npt_customer',JSON.stringify(d.customer));S.customers=S.customers||[];const i=S.customers.findIndex(x=>String(x.mobile||'').replace(/\D/g,'')===String(d.customer.mobile||'').replace(/\D/g,''));if(i>=0)S.customers[i]=d.customer;else S.customers.push(d.customer);save();document.getElementById('accountText').textContent=(d.customer.name||'Account').split(' ')[0]}else if(r.status===404){localStorage.removeItem('npt_customer');document.getElementById('accountText').textContent='Account'}}catch(e){}}
let customerSyncBusy=false,lastCustomerSyncAt=0;
async function syncLiveCustomer(renderOrders=false){const c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(!c||customerSyncBusy)return false;customerSyncBusy=true;try{const qs=new URLSearchParams();if(c.mobile)qs.set('mobile',c.mobile);if(c.email)qs.set('email',c.email);const r=await fetch((window.NPT_API_BASE||'')+'/api/store/orders?'+qs.toString(),{cache:'no-store'});const d=await r.json();if(!d.ok)return false;const oldOrders=JSON.stringify(S.orders||[]);const oldNotifs=JSON.stringify(myNotifications());const localCustomerNotifs=(S.notifications||[]).filter(n=>n.audience==='customer');const readMap=new Map(localCustomerNotifs.map(n=>[String(n.id),!!n.read]));S.orders=d.orders||[];const incoming=(d.notifications||[]).map(n=>({...n,read:readMap.has(String(n.id))?readMap.get(String(n.id)):!!n.read}));S.notifications=(S.notifications||[]).filter(n=>n.audience!=='customer');S.notifications.push(...incoming);S.notifications.sort((a,b)=>new Date(b.date)-new Date(a.date));lastCustomerSyncAt=Date.now();save();updateCart();const ordersChanged=JSON.stringify(S.orders)!==oldOrders;const notifsChanged=JSON.stringify(myNotifications())!==oldNotifs;const drawer=document.getElementById('drawer');const title=document.getElementById('drawerTitle')?.textContent;if(ordersChanged&&(renderOrders||drawer?.classList.contains('open')&&title==='My Orders'))showOrders();if(ordersChanged&&drawer?.classList.contains('open')&&title==='Order details'){const detailId=drawer.dataset.orderId;const fresh=S.orders.find(o=>o.id===detailId);if(fresh)showOrderDetail(fresh.id)}if(notifsChanged&&drawer?.classList.contains('open')&&title==='Notifications')showNotifications();return true}catch(e){return false}finally{customerSyncBusy=false}}
setInterval(()=>syncLiveCustomer(true),3000);setInterval(()=>syncLiveCatalog(false),8000);
let pushInitialized=false;
async function initBrowserPush(){try{if(pushInitialized)return;if(!('Notification' in window)||!('serviceWorker' in navigator)||!window.firebase)return;const r=await fetch((window.NPT_API_BASE||'')+'/api/push/config',{cache:'no-store'});const d=await r.json();if(!d.ok||!d.configured)return;const reg=await navigator.serviceWorker.register('/customer-store/firebase-messaging-sw.js');try{await reg.active?.postMessage({type:'NPT_FIREBASE_CONFIG',config:d.config})}catch{}if(Notification.permission==='default'){const ask=confirm('Enable New Pratap Tools notifications for order updates and offers?');if(!ask)return;await Notification.requestPermission()}if(Notification.permission!=='granted')return;if(!firebase.apps.length)firebase.initializeApp(d.config);const messaging=firebase.messaging();const token=await messaging.getToken({vapidKey:d.config.vapidKey,serviceWorkerRegistration:reg});const c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(token&&c){await fetch((window.NPT_API_BASE||'')+'/api/push/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token,customer:{mobile:c.mobile,email:c.email}})})}pushInitialized=true;messaging.onMessage(payload=>{const n={id:'local-push-'+Date.now(),type:payload.data?.type||'general',audience:'customer',customerRef:c?.mobile||c?.email,title:payload.notification?.title||'New Pratap Tools',text:payload.notification?.body||'',read:false,date:new Date().toISOString(),orderId:payload.data?.orderId||''};S.notifications=S.notifications||[];S.notifications.unshift(n);save();updateCart();toast(n.title);});}catch(e){}}
function requestPushPermission(){if(!('Notification' in window))return toast('Browser notifications are not supported here');if(Notification.permission==='granted')return initBrowserPush();Notification.requestPermission().then(x=>x==='granted'?initBrowserPush():toast('Notifications remain off'))}
function toast(t){const x=document.getElementById('toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),2200)}
function myNotifications(){
 const c=JSON.parse(localStorage.getItem('npt_customer')||'null');
 const mobile=String(c?.mobile||'').replace(/\D/g,''); const email=String(c?.email||'').toLowerCase();
 return (S.notifications||[]).filter(n=>{if(n.audience!=='customer')return false;const ref=String(n.customerRef||'');const refMobile=ref.replace(/\D/g,'');const refEmail=ref.toLowerCase();return !c||!ref||((mobile&&refMobile===mobile)||(email&&refEmail===email));});
}
function updateCart(){document.getElementById('cartCount').textContent=cart.reduce((a,x)=>a+x.qty,0);const unread=myNotifications().filter(n=>!n.read).length;const dot=document.getElementById('notifDot');if(dot)dot.style.display=unread?'block':'none';const badge=document.getElementById('mobileNotifBadge');if(badge){badge.textContent=unread>9?'9+':unread;badge.style.display=unread?'inline-flex':'none'}}
function catNav(){document.getElementById('catNav').innerHTML=`<button class="active" onclick="setCat('All Products',this)">All Products</button>`+NPT.categories.map(c=>`<button onclick="setCat('${c}',this)">${c}</button>`).join('')}
function setCat(c,el){currentCat=c;homeShowAll=false;document.querySelectorAll('.catnav button').forEach(x=>x.classList.remove('active'));if(el)el.classList.add('active');renderHome()}
function goHome(){currentCat='All Products';homeShowAll=false;renderHome();window.scrollTo({top:0,behavior:'smooth'})}
function openDrawer(){const d=document.getElementById('drawer'),sh=document.getElementById('shade');if(d)d.classList.add('open');if(sh)sh.classList.add('show');document.body.classList.add('drawer-open')}
function closeDrawer(){const d=document.getElementById('drawer'),sh=document.getElementById('shade');if(d)d.classList.remove('open');if(sh)sh.classList.remove('show');document.body.classList.remove('drawer-open')}
function mobileNav(tab){document.querySelectorAll('.mobile-nav [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(navigator.vibrate)try{navigator.vibrate(8)}catch(e){} }
function showCategories(){openDrawer();document.getElementById('drawerTitle').textContent='Categories';document.getElementById('drawerBody').innerHTML=`<div class="side-menu">${NPT.categories.map(c=>`<button onclick="closeDrawer();homeShowAll=false;currentCat='${c}';renderHome();setTimeout(()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'}),50)">${c}<span>›</span></button>`).join('')}</div>`}
function productCard(p,i=0){return `<article class="product" style="animation-delay:${Math.min(i*35,350)}ms" onclick="openProduct('${p.id}')"><span class="badge">${p.badge||'New'}</span><button class="heart" onclick="event.stopPropagation();toggleWishlist('${p.id}')">${wishlist().includes(p.id)?'♥':'♡'}</button><img src="${NPT.productImage(p)}" loading="lazy"><div class="brandtxt">${p.brand} · ${p.category}</div><h3>${p.name}</h3><div class="ratingrow"><span class="stars">${NPT.stars(p.rating)}</span><span class="rc">${p.rating?Number(p.rating).toFixed(1):''}${p.reviewCount?` (${p.reviewCount})`:''}</span></div><div><span class="price">${NPT.money(p.price)}</span><span class="mrp">${NPT.money(p.mrp)}</span></div><div class="stock">● ${p.stock>0?`In Stock (${p.stock} available)`:'Out of stock'}</div><button class="add" onclick="event.stopPropagation();addCart('${p.id}',event)">ADD TO CART</button></article>`}

/* ------------------------------------------------------------------
 * PRODUCT DETAIL PAGE
 * ------------------------------------------------------------------ */
let pdpQty = 1;
function openProduct(id){
 S=NPT.load();
 const p=S.products.find(x=>x.id===id);
 if(!p){toast('Product not found');return}
 pdpQty=1;
 window.scrollTo({top:0,behavior:'smooth'});
 IntegrationHub.emit('analytics.event',{name:'product_viewed',productId:id});
 const images=(p.images&&p.images.length?p.images:[NPT.productImage(p)]);
 const related=S.products.filter(x=>x.id!==p.id&&(x.category===p.category||x.brand===p.brand)).slice(0,4);
 const specs=p.specifications||{};
 const specRows=Object.keys(specs).map(k=>`<tr><td>${k}</td><td>${specs[k]}</td></tr>`).join('')||'<tr><td colspan="2" class="muted">Specifications will be added soon.</td></tr>';
 const detailRows=[
  ['Model number', p.model||'—'],
  ['Manufacturer', p.manufacturer||p.brand],
  ['Country of origin', p.countryOfOrigin||'India'],
  ['SKU', p.sku||p.id],
 ].map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
 const inWish=wishlist().includes(p.id);
 document.getElementById('app').innerHTML=`
 <section class="pdp-wrap">
  <div class="breadcrumb"><a onclick="goHome()">Home</a><span>/</span><a onclick="homeShowAll=false;currentCat='${p.category}';renderHome()">${p.category}</a><span>/</span><span class="current">${p.name}</span></div>
  <div class="pdp-grid">
   <div class="pdp-gallery">
    <div class="pdp-main-img"><img id="pdpMainImg" src="${images[0]}" alt="${p.name}"></div>
    ${images.length>1?`<div class="pdp-thumbs">${images.map((img,i)=>`<button class="pdp-thumb ${i===0?'active':''}" onclick="document.getElementById('pdpMainImg').src='${img}';document.querySelectorAll('.pdp-thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active')"><img src="${img}"></button>`).join('')}</div>`:''}
   </div>
   <div class="pdp-info">
    <div class="brandtxt">${p.brand} · ${p.category}</div>
    <h1>${p.name}</h1>
    <div class="ratingrow"><span class="stars">${NPT.stars(p.rating)}</span><span class="rc">${p.rating?Number(p.rating).toFixed(1):'New'}${p.reviewCount?` · ${p.reviewCount} reviews`:''}</span>${p.purchaseCount?`<span class="purchase-count">· ${p.purchaseCount}+ bought recently</span>`:''}</div>
    <div class="pdp-price-row"><span class="price">${NPT.money(p.price)}</span><span class="mrp">${NPT.money(p.mrp)}</span>${p.mrp>p.price?`<span class="off">${Math.round(100-(p.price/p.mrp*100))}% off</span>`:''}</div>
    <div class="stock">● ${p.stock>0?`In Stock (${p.stock} available)`:'Out of stock'}</div>
    <div class="pdp-meta"><span>SKU: ${p.sku||p.id}</span>${p.power?`<span>Power: ${p.power}</span>`:''}<span>Model: ${p.model||'—'}</span></div>
    <p class="pdp-desc">${p.description||''}</p>
    ${p.features&&p.features.length?`<ul class="pdp-features">${p.features.map(f=>`<li>${f}</li>`).join('')}</ul>`:''}
    <div class="pdp-actions">
     <div class="qty pdp-qty"><button onclick="pdpQty=Math.max(1,pdpQty-1);document.getElementById('pdpQtyVal').textContent=pdpQty">−</button><span id="pdpQtyVal">${pdpQty}</span><button onclick="pdpQty=pdpQty+1;document.getElementById('pdpQtyVal').textContent=pdpQty">+</button></div>
     ${p.stock>0?`<button class="add" onclick="pdpAddToCart('${p.id}')">Add to cart</button><button class="primary buynow" onclick="pdpBuyNow('${p.id}')">Buy now</button>`:`<button class="add notify-btn" onclick="notifyWhenAvailable('${p.id}')">Notify me</button>`}
     <button class="heart pdp-heart" onclick="toggleWishlist('${p.id}');openProduct('${p.id}')">${inWish?'♥ Wishlisted':'♡ Wishlist'}</button>
    </div>
    ${p.demoUrl?`<a class="demo-link" href="${p.demoUrl}" target="_blank" rel="noopener">▶ Watch demonstration / product reference</a>`:''}
    <a class="wa pdp-wa" href="https://wa.me/919810638157?text=${encodeURIComponent('Hello New Pratap Tools, I have a question about '+p.name+' ('+(p.sku||p.id)+').')}" target="_blank">Ask on WhatsApp ↗</a>
    <div class="delivery-info"><b>Delivery</b><span>Courier pickup from Ghaziabad · Usually dispatched in 1–2 business days.</span></div>
   </div>
  </div>
  <div class="pdp-tabs-section">
   <h3>Specifications</h3>
   <table class="spec-table"><tbody>${specRows}</tbody></table>
  </div>
  <div class="pdp-tabs-section">
   <h3>Product details</h3>
   <table class="spec-table"><tbody>${detailRows}</tbody></table>
  </div>
  <div class="pdp-tabs-section">
   <h3>Sold by</h3>
   <div class="seller-card">
    <div class="seller-info"><b>${p.seller?.name||'New Pratap Tools & Abrasives'}</b><span class="seller-meta">${p.seller?.location||'Ghaziabad, Uttar Pradesh'} ${p.seller?.gstVerified?'· ✓ GST verified':''}</span></div>
    <div class="seller-rating"><span class="stars">${NPT.stars(p.seller?.rating||4.7)}</span><span>${Number(p.seller?.rating||4.7).toFixed(1)} seller rating</span></div>
   </div>
  </div>
  <div class="pdp-tabs-section" id="reviewsSection">
   <h3>Ratings & reviews</h3>
   <div class="rating-breakdown">
    <div class="rating-bar-row"><span>Overall</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${((p.rating||0)/5*100)}%"></div></div><span>${p.rating?Number(p.rating).toFixed(1):'—'}</span></div>
    <div class="rating-bar-row"><span>Quality</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${((p.qualityRating||0)/5*100)}%"></div></div><span>${p.qualityRating?Number(p.qualityRating).toFixed(1):'—'}</span></div>
    <div class="rating-bar-row"><span>Usability</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${((p.usabilityRating||0)/5*100)}%"></div></div><span>${p.usabilityRating?Number(p.usabilityRating).toFixed(1):'—'}</span></div>
   </div>
   <div class="write-review">
    <h4>Write a review</h4>
    <div class="star-picker" id="reviewStars">${[1,2,3,4,5].map(n=>`<button type="button" data-n="${n}" onclick="setReviewStar(${n})">★</button>`).join('')}</div>
    <textarea id="reviewText" rows="3" placeholder="Share your experience with this tool..."></textarea>
    <button class="checkout" onclick="submitReview('${p.id}')">Submit review</button>
   </div>
   ${(p.reviews&&p.reviews.length)?p.reviews.map(r=>`<div class="review-card"><div class="review-head"><b>${r.name}</b><small>${new Date(r.date).toLocaleDateString()}</small></div><span class="stars">${NPT.stars(r.rating)}</span>${r.verified?' <small style="color:#12874b">✓ Verified purchase</small>':''}<p>${r.comment}</p></div>`).join(''):'<p class="muted">No reviews yet — be the first to share your experience.</p>'}
  </div>
  ${related.length?`<div class="section related-section"><div class="sectionhead"><div><div class="kicker">YOU MAY ALSO LIKE</div><h2>Related products</h2></div></div><div class="products">${related.map(productCard).join('')}</div></div>`:''}
 </section>`;
}
function pdpAddToCart(id){
 const p=S.products.find(x=>x.id===id);if(!p||p.stock<1)return notifyWhenAvailable(id);
 let item=cart.find(x=>x.id===id);
 if(item)item.qty+=pdpQty;else cart.push({id,qty:pdpQty});
 save();fly(document.getElementById('pdpMainImg'));toast('Added to cart');pulseCart();
}
function pdpBuyNow(id){
 const p=S.products.find(x=>x.id===id);if(!p||p.stock<1)return notifyWhenAvailable(id);
 let item=cart.find(x=>x.id===id);
 if(item)item.qty=Math.max(item.qty,pdpQty);else cart.push({id,qty:pdpQty});
 save();checkout();
}
let reviewStarValue=0;
function setReviewStar(n){
 reviewStarValue=n;
 document.querySelectorAll('#reviewStars button').forEach(b=>b.classList.toggle('active',+b.dataset.n<=n));
}
function submitReview(id){
 if(!reviewStarValue)return toast('Please select a star rating');
 const text=document.getElementById('reviewText').value.trim();
 if(!text)return toast('Please write a short review');
 const c=JSON.parse(localStorage.getItem('npt_customer')||'null');
 const p=S.products.find(x=>x.id===id);if(!p)return;
 p.reviews=p.reviews||[];
 p.reviews.unshift({id:id+'-r'+Date.now(),name:c?.name||'Guest customer',rating:reviewStarValue,comment:text,date:new Date().toISOString(),verified:!!(c&&myOrders().some(o=>o.items.some(it=>it.id===id)))});
 p.reviewCount=p.reviews.length;
 p.rating=Math.round((p.reviews.reduce((a,r)=>a+r.rating,0)/p.reviews.length)*10)/10;
 save();
 IntegrationHub.emit('review.submitted',{productId:id,rating:reviewStarValue});
 reviewStarValue=0;
 toast('Thanks for your review!');
 openProduct(id);
 setTimeout(()=>document.getElementById('reviewsSection')?.scrollIntoView({behavior:'smooth'}),80);
}
function renderHome(){
 S=NPT.load();
 let ps=S.products.filter(p=>currentCat==='All Products'||p.category===currentCat);
 const heroImg='assets/hero-tools.svg', offerImg='assets/offer-tools.svg', serviceImg='assets/service-tools.svg';
 document.getElementById('app').innerHTML=`
 <section class="hero-v9">
   <div class="hero-copy">
    <span class="eyebrow-pill">BOSCH + MAKITA · GHAZIABAD</span>
    <h1>Professional tools.<br><span>Serious performance.</span></h1>
    <p>Shop genuine power tools, compare prices, order online and get courier delivery from New Pratap Tools & Abrasives.</p>
    <div class="actions"><button class="primary" onclick="scrollToProducts()">Shop power tools <span>→</span></button><button class="secondary glass-btn" onclick="showCategories()">Browse categories</button></div>
    <div class="hero-trust"><span>✓ Original products</span><span>✓ UPI & cards</span><span>✓ COD available</span></div>
   </div>
   <div class="hero-media"><img src="${heroImg}" alt="Bosch and Makita professional power tools"><div class="hero-orb orb1"></div><div class="hero-orb orb2"></div><div class="hero-float">⚡ Fast dispatch<br><small>from Ghaziabad</small></div></div>
 </section>
 <section class="visual-rail"><div class="mini-feature"><span>01</span><div><b>Power tools</b><small>Built for daily work</small></div></div><div class="mini-feature"><span>02</span><div><b>Best-value offers</b><small>Clear prices, no clutter</small></div></div><div class="mini-feature"><span>03</span><div><b>Doorstep delivery</b><small>Courier tracking supported</small></div></div></section>
 <section class="campaign-grid"><div class="campaign-card campaign-main"><img src="${offerImg}" alt="New Pratap Tools offers"><div class="campaign-overlay"><span class="kicker">LIMITED STORE OFFERS</span><h2>Upgrade your workshop.</h2><p>Featured Bosch & Makita tools, selected for professionals.</p><button class="primary" onclick="scrollToProducts()">Explore offers →</button></div></div><div class="campaign-card service-card"><img src="${serviceImg}" alt="Tool support and delivery"><div class="service-copy"><span class="kicker">SHOP WITH CONFIDENCE</span><h3>Support before & after purchase</h3><p>Need the right model? Share the tool name or photo and our team can help.</p><a class="wa" href="https://wa.me/919810638157?text=Hello%20New%20Pratap%20Tools,%20I%20need%20help%20choosing%20a%20tool." target="_blank">Talk to us on WhatsApp ↗</a></div></div></section>
 <section class="section category-section"><div class="sectionhead"><div><div class="kicker">SHOP BY CATEGORY</div><h2>Find the right tool</h2></div><button class="secondary light-btn" onclick="showCategories()">View all →</button></div><div class="categories">${NPT.categories.map((c,i)=>`<div class="catcard" style="animation-delay:${i*35}ms;background-image:url('${NPT.categoryArt(c,i)}')" onclick="homeShowAll=false;currentCat='${c}';renderHome();setTimeout(()=>document.getElementById('products')?.scrollIntoView({behavior:'smooth'}),50)"><div class="catcard-overlay"><b>${c}</b><span class="muted">${S.products.filter(p=>p.category===c).length} products</span></div></div>`).join('')}</div></section>
 <section class="section product-section" id="products"><div class="sectionhead"><div><div class="kicker">CURATED FOR PROFESSIONALS</div><h2>${currentCat}</h2></div><span class="results-count">${ps.length} products</span></div><div class="products">${(homeShowAll?ps:ps.slice(0,PAGE_SIZE)).map(productCard).join('')}</div>${!homeShowAll&&ps.length>PAGE_SIZE?`<div class="viewall-wrap"><button class="secondary viewall-btn" onclick="homeShowAll=true;renderHome();setTimeout(scrollToProducts,50)">View all ${ps.length} products →</button></div>`:''}</section>
 <section class="service-band"><div><span class="kicker">NEW PRATAP TOOLS & ABRASIVES</span><h2>Everything you need to keep work moving.</h2></div><div class="service-points"><div><b>Secure checkout</b><small>UPI, cards, net banking & COD</small></div><div><b>Courier delivery</b><small>AWB / tracking ready</small></div><div><b>Human support</b><small>WhatsApp assistance</small></div></div></section>
 <section class="helpline-band">
  <div class="helpline-copy"><span class="kicker">CUSTOMER CARE</span><h2>Need help choosing or tracking a tool?</h2><p>Our team is available for product questions, bulk orders and order support.</p></div>
  <div class="helpline-actions">
   <a class="helpline-card" href="tel:+919810638157"><span class="helpline-icon">☎</span><span><b>Call us</b><small>+91 98106 38157</small></span></a>
   <a class="helpline-card" href="https://wa.me/919810638157?text=Hello%20New%20Pratap%20Tools,%20I%20need%20help." target="_blank"><span class="helpline-icon">💬</span><span><b>WhatsApp</b><small>Usually replies within minutes</small></span></a>
   <button class="helpline-card" onclick="toggleChat()"><span class="helpline-icon">🤖</span><span><b>Chat with us</b><small>Instant help on the store</small></span></button>
  </div>
  <div class="helpline-hours">Mon–Sat · 10:00 AM – 7:00 PM IST · Shop No. 12/13, Dayal Market, Hapur Road, Chanderpuri, Ghaziabad</div>
 </section>
 <section class="policy-cards"><button onclick="showPolicy('shipping')"><span>↗</span><b>Shipping</b><small>Delivery & pickup information</small></button><button onclick="showPolicy('returns')"><span>↺</span><b>Returns</b><small>Eligibility & process</small></button><button onclick="showPolicy('refunds')"><span>₹</span><b>Refunds</b><small>Refund timelines</small></button><button onclick="showPolicy('cancellation')"><span>×</span><b>Cancellation</b><small>Order cancellation rules</small></button></section>`;
 initShader();
}

function scrollToProducts(){document.getElementById('products')?.scrollIntoView({behavior:'smooth'})}
function addCart(id,e){let p=S.products.find(x=>x.id===id);if(!p||p.stock<1){notifyWhenAvailable(id);return}let item=cart.find(x=>x.id===id);if(item)item.qty++;else cart.push({id,qty:1});save();fly(e?.currentTarget);toast('Added to cart');pulseCart()}
function fly(el){if(!el)return;const cartBtn=document.querySelector('.cartbtn');const navCart=document.querySelector('.mobile-nav [data-tab=cart]');const target=cartBtn||navCart;const r=el.getBoundingClientRect();const x=document.createElement('div');x.className='flying';const img=el.tagName==='IMG'?el:el.closest('.product')?.querySelector('img');if(img?.src)x.style.backgroundImage=`url(\"${img.src}\")`;x.style.left=(r.left+r.width/2-24)+'px';x.style.top=(r.top+r.height/2-24)+'px';if(target){const tr=target.getBoundingClientRect();x.style.setProperty('--fx',(tr.left+tr.width/2-(r.left+r.width/2))+'px');x.style.setProperty('--fy',(tr.top+tr.height/2-(r.top+r.height/2))+'px')}document.body.appendChild(x);setTimeout(()=>x.remove(),820)}
function pulseCart(){const btn=document.querySelector('.cartbtn');if(btn){btn.classList.remove('bump');void btn.offsetWidth;btn.classList.add('bump')}const nav=document.querySelector('.mobile-nav [data-tab=cart]');if(nav){nav.classList.remove('cart-pop');void nav.offsetWidth;nav.classList.add('cart-pop')}}
function openMenu(){openDrawer();document.getElementById('drawerTitle').textContent='Your space';let c=JSON.parse(localStorage.getItem('npt_customer')||'null');let first=c?.name?c.name.split(' ')[0]:'Guest';document.getElementById('drawerBody').innerHTML=`<div class="profile-hero"><div class="profile-avatar">${first.slice(0,1).toUpperCase()}</div><div><div class="kicker">NEW PRATAP TOOLS</div><h3>${c?`Hello, ${first}`:'Shop as Guest'}</h3><p>${c?'Your orders, wishlist and offers in one place.':'Sign in anytime to save orders and preferences.'}</p></div></div><div class="quick-grid"><button onclick="showOrders()"><span>📦</span><b>Orders</b><small>${myOrders().length} saved</small></button><button onclick="showWishlist()"><span>♡</span><b>Wishlist</b><small>${wishlist().length} items</small></button><button onclick="showCoupons()"><span>🎟</span><b>Coupons</b><small>3 offers</small></button><button onclick="showNotifications()"><span>🔔</span><b>Alerts</b><small>${myNotifications().filter(n=>!n.read).length} new</small></button></div><div class="menu-section"><small>SHOP</small><button onclick="closeDrawer();goHome()"><span>⌂ <b>Home</b></span><span>›</span></button><button onclick="showCategories()"><span>☷ <b>All categories</b></span><span>›</span></button><button onclick="openCart()"><span>🛒 <b>My cart</b></span><span class="menu-count">${cart.reduce((a,x)=>a+x.qty,0)}</span></button></div><div class="menu-section"><small>ACCOUNT</small><button onclick="showProfile()"><span>◯ <b>${c?'My profile':'Sign in / Create account'}</b></span><span>›</span></button><button onclick="showHelp()"><span>💬 <b>Help & WhatsApp</b></span><span>›</span></button>${c?`<button onclick="logoutCustomer()"><span>↪ <b>Sign out</b></span><span>›</span></button>`:''}</div>`}
function openCart(){openDrawer();document.getElementById('drawerTitle').textContent='Your Cart';renderCart()}
function renderCart(){let b=document.getElementById('drawerBody');if(!cart.length){b.innerHTML=`<div class="empty">Your cart is empty.<br><button class="primary" style="margin-top:15px" onclick="closeDrawer();scrollToProducts()">Explore products</button></div>`;return}let total=0;b.innerHTML=cart.map(i=>{let p=S.products.find(x=>x.id===i.id);total+=p.price*i.qty;return `<div class="cartitem"><img src="${NPT.productImage(p)}"><div><b>${p.name}</b><div class="muted">${NPT.money(p.price)}</div><div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button>${i.qty}<button onclick="changeQty('${p.id}',1)">+</button></div></div><button onclick="removeCart('${p.id}')" style="border:0;background:none;color:#d92d20">×</button></div>`}).join('')+`<div style="padding-top:18px"><div style="display:flex;justify-content:space-between"><b>Subtotal</b><b>${NPT.money(total)}</b></div><div class="notice" style="margin-top:12px">Choose UPI, cards, net banking, wallets or Cash on Delivery.</div><button class="checkout" onclick="checkout()">Proceed to secure checkout</button></div>`}
function changeQty(id,n){let i=cart.find(x=>x.id===id),p=S.products.find(x=>x.id===id);if(!i)return;i.qty=Math.max(0,Math.min(p.stock,i.qty+n));cart=cart.filter(x=>x.qty>0);save();renderCart()}
function removeCart(id){cart=cart.filter(x=>x.id!==id);save();renderCart()}
function checkout(){if(!cart.length)return toast('Your cart is empty');openDrawer();document.getElementById('drawerTitle').textContent='Checkout';let c=JSON.parse(localStorage.getItem('npt_customer')||'null')||{};let hasSaved=!!(c.address&&c.pincode);let savedLabel=hasSaved?`${c.address}${c.city?', '+c.city:''} · ${c.pincode}`:'';document.getElementById('drawerBody').innerHTML=`<div class="notice">You can checkout as a guest. Creating an account is optional and gives you easier order tracking.</div>${hasSaved?`<div class="delivery-choice"><div><div class="kicker">DELIVERY ADDRESS</div><h4>Where should we deliver this order?</h4><p class="muted">Choose your saved address or enter a new one for this order.</p></div><div class="address-options"><button id="savedAddressBtn" class="address-option active" onclick="chooseDeliveryAddress('saved')"><span class="address-radio">✓</span><span><b>Deliver to saved address</b><small>${savedLabel}</small></span></button><button id="newAddressBtn" class="address-option" onclick="chooseDeliveryAddress('new')"><span class="address-radio">＋</span><span><b>Use a new address</b><small>Enter another delivery address</small></span></button></div></div>`:''}<div class="form"><h4>Delivery details</h4><input id="cname" value="${c.name||''}" placeholder="Full name *"><input id="cmobile" value="${c.mobile||''}" placeholder="Mobile number *"><input id="cemail" value="${c.email||''}" placeholder="Email (optional)"><textarea id="caddress" rows="3" placeholder="Complete delivery address *">${c.address||''}</textarea><div class="row"><input id="ccity" placeholder="City" value="${c.city||'Ghaziabad'}"><input id="cpin" placeholder="Pincode *" value="${c.pincode||''}"></div></div><div class="paybox"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><b>Choose payment method</b><div class="muted">Select what works best for you</div></div><span class="secure-pill">✓ Secure</span></div><div class="payoptions"><button class="payopt active" onclick="selectPay(this,'UPI')">↗ UPI</button><button class="payopt" onclick="selectPay(this,'Credit / Debit Card')">▣ Credit / Debit Card</button><button class="payopt" onclick="selectPay(this,'Net Banking')">⌁ Net Banking</button><button class="payopt" onclick="selectPay(this,'Wallets')">◉ Wallets</button><button class="payopt" onclick="selectPay(this,'Cash on Delivery')">▣ Cash on Delivery</button></div><div id="onlineApps" class="upiapps"><span>Google Pay</span><span>PhonePe</span><span>Paytm</span><span>BHIM</span><span>Other UPI App</span></div><div id="codNote" class="cod-note" style="display:none">Pay when your order arrives. COD availability may depend on delivery location and order value.</div></div><div class="notice">By placing your order, you agree to our shipping and return terms.</div><button class="checkout" onclick="placeOrder()">Pay securely & place order</button>`}
function selectPay(el,pay){activePay=pay;document.querySelectorAll('.payopt').forEach(x=>x.classList.remove('active'));el.classList.add('active')}
function chooseDeliveryAddress(mode){let c=JSON.parse(localStorage.getItem('npt_customer')||'null')||{};let saved=mode==='saved';document.getElementById('savedAddressBtn')?.classList.toggle('active',saved);document.getElementById('newAddressBtn')?.classList.toggle('active',!saved);if(saved){document.getElementById('cname').value=c.name||'';document.getElementById('cmobile').value=c.mobile||'';document.getElementById('cemail').value=c.email||'';document.getElementById('caddress').value=c.address||'';document.getElementById('ccity').value=c.city||'Ghaziabad';document.getElementById('cpin').value=c.pincode||'';toast('Saved address selected')}else{document.getElementById('caddress').value='';document.getElementById('ccity').value='';document.getElementById('cpin').value='';toast('Enter your new delivery address')}}
async function saveCustomerAddress(){let c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(!c)return showAuth('login');let address=document.getElementById('profileAddress').value.trim(),city=document.getElementById('profileCity').value.trim(),pincode=document.getElementById('profilePincode').value.trim();if(!address||!pincode)return toast('Enter address and pincode');c={...c,address,city,pincode};try{const r=await fetch((window.NPT_API_BASE||'')+'/api/store/customer',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({customer:c})});const d=await r.json();if(!d.ok)throw new Error(d.error||'Address sync failed');c=d.customer;localStorage.setItem('npt_customer',JSON.stringify(c));S.customers=S.customers||[];const idx=S.customers.findIndex(x=>x.mobile===c.mobile||x.email===c.email);if(idx>=0)S.customers[idx]={...S.customers[idx],...c};else S.customers.push(c);save();IntegrationHub.emit('address.saved',{mobile:c.mobile,city,pincode});toast('Address saved');showProfile()}catch(e){toast('Could not save address. Please try again.')}}
async function placeOrder(){let name=document.getElementById('cname').value.trim(),mobile=document.getElementById('cmobile').value.trim(),email=document.getElementById('cemail').value.trim(),address=document.getElementById('caddress').value.trim(),pincode=document.getElementById('cpin').value.trim(),city=document.getElementById('ccity').value.trim();if(!name||!mobile||!address||!pincode)return toast('Please complete required delivery details');let total=0,items=cart.map(i=>{let p=S.products.find(x=>x.id===i.id);total+=p.price*i.qty;return{id:p.id,name:p.name,qty:i.qty,price:p.price}});let oid='NPT-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+String(Date.now()).slice(-5);let c0=JSON.parse(localStorage.getItem('npt_customer')||'null');let customerId=c0?.email||c0?.mobile||('GUEST-'+mobile.slice(-4));let o={id:oid,customerId,customer:{name,mobile,email,address,city,pincode},items,total,payment:activePay,paymentStatus:activePay==='Cash on Delivery'?'Pending — COD':'Paid (Demo)',status:'Order Placed',courier:'Pending',awb:'',created:new Date().toISOString()};try{const r=await fetch((window.NPT_API_BASE||'')+'/api/store/order',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({order:o,customer:{name,mobile,email,address,city,pincode,created:c0?.created||new Date().toISOString()}})});const d=await r.json();if(!d.ok)throw new Error(d.error||'Order sync failed');o=d.order||o;await syncLiveCustomer(false)}catch(e){S.orders.unshift(o);S.notifications.unshift({id:'n'+Date.now()+'c',title:'Order placed · '+oid,audience:'customer',customerRef:mobile||email,type:'order',orderId:oid,text:'Your order has been placed. We will notify you as it moves through processing and dispatch.',read:false,date:new Date().toISOString()});toast('Order saved locally; live sync unavailable')}IntegrationHub.emit('order.created',{orderId:oid,total,payment:activePay,customerMobile:mobile,guest:!c0});IntegrationHub.emit(activePay==='Cash on Delivery'?'payment.cod_selected':'payment.create',{orderId:oid,amount:total,method:activePay});IntegrationHub.emit('invoice.create',{orderId:oid});IntegrationHub.emit('analytics.event',{name:'purchase',orderId:oid,value:total});IntegrationHub.emit('whatsapp.send',{template:'order_confirmation',orderId:oid});IntegrationHub.emit('email.send',{template:'order_confirmation',orderId:oid});IntegrationHub.emit('sms.send',{template:'order_confirmation',orderId:oid});S.products.forEach(p=>{let i=cart.find(x=>x.id===p.id);if(i)p.stock=Math.max(0,p.stock-i.qty)});S.customers=S.customers||[];if(email&&!S.customers.some(x=>x.email===email))S.customers.push({name,mobile,email,address,city,pincode,created:new Date().toISOString()});cart=[];localStorage.setItem('npt_cart','[]');save();showPaymentProcessing(o)}
function showPaymentProcessing(o){
 const isCod=o.payment==='Cash on Delivery';
 document.getElementById('drawerTitle').textContent=isCod?'Confirming order':'Processing payment';
 document.getElementById('drawerBody').innerHTML=`<div class="processing-box"><div class="spinner"></div><h3>${isCod?'Confirming your order…':'Processing your payment…'}</h3><p class="muted">Please don't close this window. This will only take a moment.</p></div>`;
 setTimeout(()=>showOrder(o),900);
}
function showOrder(o){openDrawer();document.getElementById('drawerTitle').textContent='Order confirmed';document.getElementById('drawerBody').innerHTML=`<div class="orderbox"><div class="success-check"><svg viewBox="0 0 52 52"><path d="M14 27l8 8 16-18"/></svg></div><div class="kicker" style="text-align:center">ORDER ID</div><h2 style="text-align:center">${o.id}</h2><p style="text-align:center">Thanks, ${o.customer.name}. Your order is confirmed.</p><div class="timeline"><div class="step done"><i></i>Placed</div><div class="step"><i></i>Confirmed</div><div class="step"><i></i>Packed</div><div class="step"><i></i>Shipped</div><div class="step"><i></i>Delivered</div></div><b>Total: ${NPT.money(o.total)}</b><p class="muted">Payment: ${o.payment}</p></div><button class="checkout" onclick="showOrders()">Track this order</button>`}
function openAccount(){let c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(c)showProfile();else showAuth('login')}
function renderWelcome(){
 const card=document.getElementById('welcomeCard'); if(!card)return;
 const c=JSON.parse(localStorage.getItem('npt_customer')||'null');
 const offerStrip=`<div class="welcome-offer">🎁 Use code <b>NPTWELCOME</b> for ₹250 off your first order over ₹2,000</div>`;
 if(c){
   card.innerHTML=`<button class="closex" onclick="continueGuest()">×</button><div class="welcome-art"><span>NP</span></div><div class="kicker">WELCOME BACK</div><h2>Hello, ${c.name.split(' ')[0]}.</h2><p>Enter your mobile number to continue. Your account and orders are securely synced across devices.</p>${offerStrip}<div class="form"><input id="welcomeMobile" inputmode="tel" value="${c.mobile||''}" placeholder="Mobile number"></div><div class="welcome-actions"><button class="primary" onclick="quickLogin()">Continue as ${c.name.split(' ')[0]}</button><button class="textbtn" onclick="continueGuest()">Continue shopping →</button></div><div class="mini-trust"><span>✓ Saved orders</span><span>✓ Wishlist</span><span>✓ Faster checkout</span></div>`;
 }else{
   card.innerHTML=`<button class="closex" onclick="continueGuest()">×</button><div class="welcome-art"><span>NP</span></div><div class="kicker">WELCOME TO NEW PRATAP TOOLS</div><h2>Power tools, made simple.</h2><p>Sign in with your mobile number, create an account, or continue as a guest.</p>${offerStrip}<div class="form"><input id="welcomeMobile" inputmode="tel" placeholder="Mobile number"></div><div class="welcome-actions"><button class="primary" onclick="quickLogin()">Continue with mobile</button><button class="secondary light" onclick="showAuth('signup')">Create account</button><button class="textbtn" onclick="continueGuest()">Continue as guest →</button></div><div class="mini-trust"><span>✓ Guest checkout</span><span>✓ COD available</span><span>✓ Order tracking</span></div>`;
 }
}
async function quickLogin(){
 const mobile=(document.getElementById('welcomeMobile')?.value||'').replace(/\D/g,'');
 if(!mobile)return toast('Enter your mobile number');
 try{const r=await fetch((window.NPT_API_BASE||'')+'/api/store/customer?mobile='+encodeURIComponent(mobile),{cache:'no-store'});const d=await r.json();if(d.ok&&d.customer){localStorage.setItem('npt_customer',JSON.stringify(d.customer));S.customers=S.customers||[];const i=S.customers.findIndex(x=>String(x.mobile||'').replace(/\D/g,'')===mobile);if(i>=0)S.customers[i]=d.customer;else S.customers.push(d.customer);save();document.getElementById('accountText').textContent=d.customer.name.split(' ')[0];document.getElementById('welcome').classList.add('hide');await syncLiveCustomer(false);toast('Welcome back, '+d.customer.name.split(' ')[0]);return}}catch(e){}
 const existing=(S.customers||[]).find(x=>String(x.mobile||'').replace(/\D/g,'').endsWith(mobile.slice(-10)));
 if(existing){localStorage.setItem('npt_customer',JSON.stringify(existing));document.getElementById('accountText').textContent=existing.name.split(' ')[0];document.getElementById('welcome').classList.add('hide');toast('Welcome back, '+existing.name.split(' ')[0]);return}
 toast('No account found for this mobile. Create an account or continue as guest.');
}
function showAuth(mode='login'){
 const old=document.getElementById('authModal');if(old)old.remove();
 document.body.insertAdjacentHTML('beforeend',`<div class="modal" id="authModal"><div class="auth-card"><button class="closex" onclick="document.getElementById('authModal').remove()">×</button><div class="kicker">NEW PRATAP TOOLS</div><h2>${mode==='signup'?'Create your account':'Sign in securely'}</h2><p class="muted">Verify your mobile or email with a one-time code. No password required.</p><div class="auth-tabs"><button class="${mode==='login'?'active':''}" onclick="showAuth('login')">Sign in</button><button class="${mode==='signup'?'active':''}" onclick="showAuth('signup')">Create account</button></div><div class="form">${mode==='signup'?'<input id="aname" placeholder="Full name">':''}<input id="amobile" inputmode="tel" placeholder="Mobile number">${mode==='signup'?'<input id="aemail" type="email" placeholder="Email (optional)">':''}</div><div class="otp-choice"><button class="secondary" onclick="requestLoginOtp('${mode}','sms')">📱 Send SMS OTP</button><button class="secondary" onclick="requestLoginOtp('${mode}','email')">✉️ Send Email OTP</button></div><button class="textbtn" onclick="document.getElementById('authModal').remove()">Continue as guest</button></div></div>`);
}
async function requestLoginOtp(mode,channel){const mobile=(document.getElementById('amobile')?.value||'').replace(/\D/g,'').slice(-10),email=(document.getElementById('aemail')?.value||'').trim().toLowerCase();if(channel==='sms'&&!mobile)return toast('Enter your mobile number');if(channel==='email'&&!email)return toast('Enter your email');const r=await fetch((window.NPT_API_BASE||'')+'/api/auth/request-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mobile,email,channel})}).catch(()=>null);const d=await r?.json?.();if(!d?.ok)return toast(d?.error||'Could not send OTP');if(d.demoCode)toast('Demo OTP: '+d.demoCode);else toast('OTP sent');const card=document.querySelector('#authModal .auth-card');card.insertAdjacentHTML('beforeend',`<div class="otp-verify"><div class="form"><input id="otpCode" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit OTP"></div><button class="checkout" onclick="verifyLoginOtp('${mode}','${channel}')">Verify & continue</button><small>Code expires in 5 minutes.</small></div>`);}
async function verifyLoginOtp(mode,channel){const mobile=(document.getElementById('amobile')?.value||'').replace(/\D/g,'').slice(-10),email=(document.getElementById('aemail')?.value||'').trim().toLowerCase(),code=(document.getElementById('otpCode')?.value||'').trim(),name=(document.getElementById('aname')?.value||'').trim();if(!/^\d{6}$/.test(code))return toast('Enter the 6-digit OTP');const r=await fetch((window.NPT_API_BASE||'')+'/api/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mobile,email,code,channel,mode,name})}).catch(()=>null);const d=await r?.json?.();if(!d?.ok)return toast(d?.error||'Verification failed');localStorage.setItem('npt_customer',JSON.stringify(d.customer));S.customers=S.customers||[];const i=S.customers.findIndex(x=String(x.mobile||'').replace(/\D/g,'')===String(d.customer.mobile||'').replace(/\D/g,''));if(i>=0)S.customers[i]=d.customer;else S.customers.push(d.customer);save();document.getElementById('authModal')?.remove();document.getElementById('welcome')?.classList.add('hide');document.getElementById('accountText').textContent=(d.customer.name||'Account').split(' ')[0];await syncLiveCustomer(false);await initBrowserPush();toast('Welcome, '+(d.customer.name||'Customer').split(' ')[0]);}
async function quickLogin(){const mobile=(document.getElementById('welcomeMobile')?.value||'').replace(/\D/g,'').slice(-10);if(!mobile)return toast('Enter your mobile number');showAuth('login');setTimeout(()=>{const x=document.getElementById('amobile');if(x)x.value=mobile},30);}
function showProfile(){openDrawer();document.body.classList.add('profile-mode');let c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(!c){showAuth('login');return}document.getElementById('drawerTitle').textContent='My Profile';let hasAddress=!!(c.address&&c.pincode);let addressMarkup=hasAddress?`<div class="saved-address-display"><div class="saved-address-top"><div><span class="address-badge">✓ SAVED</span><h4>Primary delivery address</h4></div><button class="edit-address-btn" onclick="toggleAddressEditor()">Edit</button></div><div class="saved-address-text"><b>${c.name}</b><span>${c.address}</span><span>${c.city||'Ghaziabad'} · ${c.pincode}</span></div><div class="saved-address-note">At checkout, you can choose this saved address or use a different address for that order.</div></div><div id="addressEditor" class="form address-editor" style="display:none"><div class="editor-label">EDIT SAVED ADDRESS</div><textarea id="profileAddress" rows="3" placeholder="Complete delivery address *">${c.address||''}</textarea><div class="row"><input id="profileCity" placeholder="City" value="${c.city||'Ghaziabad'}"><input id="profilePincode" inputmode="numeric" placeholder="Pincode *" value="${c.pincode||''}"></div><div class="editor-actions"><button class="secondary" onclick="toggleAddressEditor(false)">Cancel</button><button class="checkout" onclick="saveCustomerAddress()">Update saved address</button></div></div>`:`<div class="saved-address-card"><div class="kicker">DELIVERY ADDRESS</div><h4>Save an address for faster checkout</h4><p class="muted">Your saved address will appear here. At checkout, you'll be able to choose it or enter a new address.</p><div class="form"><textarea id="profileAddress" rows="3" placeholder="Complete delivery address *"></textarea><div class="row"><input id="profileCity" placeholder="City" value="Ghaziabad"><input id="profilePincode" inputmode="numeric" placeholder="Pincode *"></div><button class="checkout" onclick="saveCustomerAddress()">Save delivery address</button></div></div>`;document.getElementById('drawerBody').innerHTML=`<div class="profile-card"><div class="profile-avatar large">${c.name.slice(0,1).toUpperCase()}</div><h2>${c.name}</h2><p class="muted">${c.mobile}${c.email?` · ${c.email}`:''}</p><div class="profile-stats"><div><b>${myOrders().length}</b><small>Orders</small></div><div><b>${wishlist().length}</b><small>Wishlist</small></div><div><b>${myNotifications().filter(n=>!n.read).length}</b><small>Alerts</small></div></div></div><div class="saved-address-wrap">${addressMarkup}</div><div class="side-menu"><button onclick="showOrders()"><span>📦 My Orders</span><span>›</span></button><button onclick="showWishlist()"><span>♡ Wishlist</span><span>›</span></button><button onclick="showCoupons()"><span>🎟 Coupons</span><span>›</span></button><button onclick="showNotifications()"><span>🔔 Notifications</span><span>›</span></button><button onclick="logoutCustomer()"><span>↪ Sign out</span><span>›</span></button></div>`}
function toggleAddressEditor(force){let el=document.getElementById('addressEditor');if(!el)return;let show=force===undefined?!(el.style.display!=='none'):force;el.style.display=show?'block':'none';if(show)el.scrollIntoView({behavior:'smooth',block:'nearest'})}
function logoutCustomer(){localStorage.removeItem('npt_customer');document.getElementById('accountText').textContent='Account';closeDrawer();toast('Signed out')}
function myOrders(){let c=JSON.parse(localStorage.getItem('npt_customer')||'null');if(!c)return [];const mobile=String(c.mobile||'').replace(/\D/g,'');const email=String(c.email||'').toLowerCase();return (S.orders||[]).filter(o=>{const om=String(o.customer?.mobile||'').replace(/\D/g,'');const oe=String(o.customer?.email||'').toLowerCase();const cid=String(o.customerId||'');return (mobile&&om===mobile)||(email&&oe===email)||(mobile&&cid.replace(/\D/g,'')===mobile)||(email&&cid.toLowerCase()===email);})}
function showOrders(){openDrawer();delete document.getElementById('drawer').dataset.orderId;document.getElementById('drawerTitle').textContent='My Orders';let os=myOrders();document.getElementById('drawerBody').innerHTML=os.length?os.map(o=>`<button class="orderbox orderbox-click" onclick="showOrderDetail('${o.id}')"><div style="display:flex;justify-content:space-between;gap:8px"><b>${o.id}</b><span class="menu-count">${o.status}</span></div><p class="muted">${new Date(o.created).toLocaleString()} · ${NPT.money(o.total)} · ${o.payment}</p><div class="timeline"><div class="step done"><i></i>Placed</div><div class="step ${o.status!=='Order Placed'?'done':''}"><i></i>Processing</div><div class="step ${['Shipped','Out for Delivery','Delivered'].includes(o.status)?'done':''}"><i></i>Shipped</div><div class="step ${o.status==='Delivered'?'done':''}"><i></i>Delivered</div></div><span class="order-open-hint">View order details →</span></button>`).join(''):`<div class="empty">${localStorage.getItem('npt_customer')?'No orders yet.':'Sign in to see saved orders.'}</div>`}
function showOrderDetail(id){const o=(S.orders||[]).find(x=>x.id===id)||myOrders().find(x=>x.id===id);if(!o){toast('Order details are not available yet');return}openDrawer();document.getElementById('drawer').dataset.orderId=o.id;document.getElementById('drawerTitle').textContent='Order details';const steps=['Order Placed','Processing','Packed','Shipped','Out for Delivery','Delivered'];const idx=Math.max(0,steps.indexOf(o.status));document.getElementById('drawerBody').innerHTML=`<div class="order-detail"><div class="order-detail-head"><div><span class="kicker">ORDER</span><h2>${o.id}</h2><p class="muted">${new Date(o.created).toLocaleString()}</p></div><span class="status-pill">${o.status}</span></div><div class="order-progress">${steps.map((s,i)=>`<div class="progress-step ${i<=idx?'done':''}"><span>${i<idx?'✓':i===idx?'●':'○'}</span><small>${s}</small></div>`).join('')}</div><div class="order-detail-card"><b>Items</b>${o.items.map(i=>`<div class="detail-line"><span>${i.name} × ${i.qty}</span><b>${NPT.money(i.price*i.qty)}</b></div>`).join('')}<div class="detail-total"><span>Total</span><b>${NPT.money(o.total)}</b></div></div><div class="order-detail-card"><b>Delivery</b><p>${o.customer.name}<br>${o.customer.mobile}<br>${o.customer.address}<br>${o.customer.city||''} · ${o.customer.pincode||''}</p></div><div class="order-detail-card"><b>Payment</b><p>${o.payment||'Online'} · ${o.paymentStatus||'Paid'}</p>${o.awb?`<p>AWB: <b>${o.awb}</b></p><a class="track-btn" href="${o.trackingUrl||'#'}" target="_blank">Track shipment →</a>`:''}</div><button class="secondary full-btn" onclick="showOrders()">← Back to my orders</button></div>`}
function wishlist(){return JSON.parse(localStorage.getItem('npt_wish')||'[]')}
function toggleWishlist(id){let w=wishlist();w=w.includes(id)?w.filter(x=>x!==id):[...w,id];localStorage.setItem('npt_wish',JSON.stringify(w));renderHome();toast(w.includes(id)?'Added to wishlist':'Removed from wishlist')}
function showWishlist(){openDrawer();document.getElementById('drawerTitle').textContent='Wishlist';let ps=S.products.filter(p=>wishlist().includes(p.id));document.getElementById('drawerBody').innerHTML=ps.length?ps.map(p=>`<div class="cartitem"><img src="${NPT.productImage(p)}"><div><b>${p.name}</b><div>${NPT.money(p.price)}</div><button class="copy" onclick="addCart('${p.id}')">Add to cart</button></div><button onclick="toggleWishlist('${p.id}');showWishlist()" style="border:0;background:none">♥</button></div>`).join(''):`<div class="empty">Your wishlist is empty.</div>`}
function showCoupons(){openDrawer();document.getElementById('drawerTitle').textContent='Coupons & Offers';document.getElementById('drawerBody').innerHTML=['NPTWELCOME — ₹250 off on eligible orders','POWER10 — 10% off selected power tools','MAKITA5 — 5% off selected Makita products'].map((x,i)=>{let [code,...rest]=x.split(' — ');return `<div class="coupon"><div><b>${code}</b><small>${rest.join(' — ')}</small></div><button class="copy" onclick="navigator.clipboard?.writeText('${code}');toast('${code} copied')">Copy</button></div>`}).join('')}
function openNotifications(){if(!JSON.parse(localStorage.getItem('npt_customer')||'null'))return showAuth('login');showNotifications()}
function showNotifications(){openDrawer();document.getElementById('drawerTitle').textContent='Notifications';const ns=myNotifications();const unread=ns.filter(n=>!n.read).length;document.getElementById('drawerBody').innerHTML=`<div class="notification-center"><div class="notification-center-head"><div><span class="kicker">NEW PRATAP TOOLS</span><h2>Your notifications</h2><p>${unread?`${unread} unread update${unread>1?'s':''}`:'You are all caught up.'}</p></div><button class="secondary" onclick="markCustomerNotificationsRead()">Mark all read</button></div><button class="push-enable" onclick="requestPushPermission()">🔔 ${typeof Notification!=='undefined'&&Notification.permission==='granted'?'Browser notifications enabled':'Enable browser notifications'}</button>${ns.slice(0,30).map(n=>`<button class="customer-notification ${n.read?'':'unread'}" onclick="openCustomerNotification('${n.id}')"><span class="notification-icon">${n.type==='order'?'📦':n.type==='offer'?'🎁':n.type==='otp'?'🔐':'🔔'}</span><span class="notification-copy"><b>${n.title}</b><small>${n.text}</small><em>${new Date(n.date).toLocaleString()}</em></span><span class="notification-arrow">›</span></button>`).join('')||'<div class="empty">No notifications yet.</div>'}</div>`}
function markCustomerNotificationsRead(){myNotifications().forEach(n=>n.read=true);save();updateCart();showNotifications()}
function openCustomerNotification(id){let n=myNotifications().find(x=>String(x.id)===String(id));if(!n)return;let full=(S.notifications||[]).find(x=>String(x.id)===String(id));if(full)full.read=true;save();updateCart();if(n.type==='order'||n.orderId){showOrderDetail(n.orderId);return}if(n.type==='stock'){closeDrawer();scrollToProducts();toast(n.title);return}showNotifications()}
function showHelp(){openDrawer();document.getElementById('drawerTitle').textContent='Help & Support';document.getElementById('drawerBody').innerHTML=`<div class="promo"><b>Need help?</b><p>WhatsApp our team about a product or order.</p><a class="wa" href="https://wa.me/919810638157" target="_blank">WhatsApp +91 9810638157</a></div>`}
function continueGuest(){document.getElementById('welcome').classList.add('hide');toast('You can shop as a guest')}
function doSearch(){hideSuggestions();let q=document.getElementById('searchInput').value.toLowerCase().trim();let ps=S.products.filter(p=>(p.name+' '+p.brand+' '+p.category+' '+(p.sku||'')).toLowerCase().includes(q));IntegrationHub.emit('search.query',{query:q,results:ps.length});pushRecentSearch(q);document.getElementById('app').innerHTML=`<section class="section"><div class="sectionhead"><div><div class="kicker">SEARCH RESULTS</div><h2>${q?`Results for "${q}"`:'All products'}</h2></div><button class="secondary" style="color:#101828;background:#fff" onclick="goHome()">Back home</button></div><div class="products">${ps.map(productCard).join('')||'<div class="empty">No products found. Try another search.</div>'}</div></section>`}

function pushRecentSearch(q){if(!q)return;let r=JSON.parse(localStorage.getItem('npt_recent_search')||'[]');r=[q,...r.filter(x=>x!==q)].slice(0,6);localStorage.setItem('npt_recent_search',JSON.stringify(r))}
function recentSearches(){return JSON.parse(localStorage.getItem('npt_recent_search')||'[]')}
function hideSuggestions(){const el=document.getElementById('searchSuggest');if(el){el.classList.remove('open');el.innerHTML=''}}
function liveSearch(){
 S=NPT.load();
 const el=document.getElementById('searchSuggest');
 const q=document.getElementById('searchInput').value.toLowerCase().trim();
 if(!q){
  const recents=recentSearches();
  if(!recents.length){hideSuggestions();return}
  let rhtml='<div class="suggest-label">Recent searches</div>';
  recents.forEach(r=>{rhtml+=suggestRecentRow(r)});
  el.innerHTML=rhtml;
  el.classList.add('open');return;
 }
 const prod=S.products.filter(p=>(p.name+' '+p.brand+' '+p.sku).toLowerCase().includes(q)).slice(0,5);
 const cats=S.categories.filter(c=>c.toLowerCase().includes(q)).slice(0,3);
 if(!prod.length&&!cats.length){el.innerHTML='<div class="suggest-empty">No matches for "'+q+'"</div>';el.classList.add('open');return}
 let html='';
 if(cats.length){
  html+='<div class="suggest-label">Categories</div>';
  cats.forEach(c=>{html+=suggestCatRow(c)});
 }
 if(prod.length){
  html+='<div class="suggest-label">Products</div>';
  prod.forEach(p=>{html+=suggestProdRow(p)});
 }
 el.innerHTML=html;
 el.classList.add('open');
}
function suggestRecentRow(r){
 return '<button class="suggest-row" onclick="document.getElementById(\'searchInput\').value=\''+r.replace(/'/g,"\\'")+'\';doSearch()"><span class="suggest-icon">⟲</span><span>'+r+'</span></button>';
}
function suggestCatRow(c){
 return '<button class="suggest-row" onclick="closeDrawer();currentCat=\''+c.replace(/'/g,"\\'")+'\';document.getElementById(\'searchInput\').value=\'\';hideSuggestions();renderHome();setTimeout(scrollToProducts,50)"><span class="suggest-icon">▦</span><span>'+c+'</span></button>';
}
function suggestProdRow(p){
 return '<button class="suggest-row" onclick="document.getElementById(\'searchInput\').value=\'\';hideSuggestions();openProduct(\''+p.id+'\')"><img src="'+NPT.productImage(p)+'"><span><b>'+p.name+'</b><small>'+p.brand+' · '+NPT.money(p.price)+'</small></span></button>';
}
function showPolicy(type){
 const titles={shipping:'Shipping Policy',returns:'Return Policy',refunds:'Refund & Replacement Policy',cancellation:'Cancellation Policy',privacy:'Privacy Policy'};
 const text=(S.policies||{})[type]||'Policy information will be updated by New Pratap Tools.';
 document.body.insertAdjacentHTML('beforeend',`<div class="policy-modal" id="policyModal" onclick="if(event.target===this)this.remove()"><div class="modal-card"><button class="close" onclick="document.getElementById('policyModal').remove()">×</button><div class="kicker">NEW PRATAP TOOLS</div><h2>${titles[type]}</h2><p>${text}</p><p class="muted">For product-specific eligibility or order assistance, contact us on WhatsApp at +91 9810638157.</p></div></div>`);
}
function notifyWhenAvailable(id){
 const p=S.products.find(x=>x.id===id);if(!p)return;
 let waits=JSON.parse(localStorage.getItem('npt_stock_alerts')||'[]');
 const c=JSON.parse(localStorage.getItem('npt_customer')||'null');
 const key=(c?.mobile||'guest')+'|'+id;
 if(!waits.some(x=>x.key===key))waits.push({key,productId:id,mobile:c?.mobile||'',name:c?.name||'Guest',date:new Date().toISOString()});
 localStorage.setItem('npt_stock_alerts',JSON.stringify(waits));
 toast('Added to your stock alert list.');
}
function toggleChat(){document.getElementById('chatbot')?.classList.toggle('open');setTimeout(()=>document.getElementById('chatInput')?.focus(),150)}
function addChat(who,text){let box=document.getElementById('chatMessages');if(!box)return;box.insertAdjacentHTML('beforeend',`<div class="chat-msg ${who}">${text}</div>`);box.scrollTop=box.scrollHeight}
function chatAsk(q){addChat('user',q);setTimeout(()=>botReply(q),250)}
function sendChat(e){e.preventDefault();let i=document.getElementById('chatInput'),q=i.value.trim();if(!q)return;i.value='';addChat('user',q);setTimeout(()=>botReply(q),250)}
function botReply(q){
 const s=q.toLowerCase();
 if(s.includes('track')){addChat('bot',myOrders().length?'Open <b>My Orders</b> from the account menu to see your latest order timeline and AWB.':'You can place an order as a guest too. Keep your Order ID for support.');return}
 if(s.includes('payment')){addChat('bot','You can pay by <b>UPI, cards, net banking, wallets</b> or <b>Cash on Delivery</b>.');return}
 if(s.includes('contact')||s.includes('whatsapp')){addChat('bot',`Need a person? <a href="https://wa.me/919810638157" target="_blank">Chat on WhatsApp</a>.`);return}
 let matches=S.products.filter(p=>(p.name+' '+p.brand+' '+p.category).toLowerCase().includes(s)).slice(0,3);
 if(s.includes('popular')||s.includes('best'))matches=S.products.slice(0,3);
 if(matches.length){addChat('bot',matches.map(p=>`${p.name} — <b>${NPT.money(p.price)}</b>${p.stock<=0?' · Out of stock':''}`).join('<br>'));return}
 addChat('bot','Try “Bosch”, “Makita”, “popular tools”, “payment”, “track my order”, or “WhatsApp”.');
}

document.addEventListener('click',(e)=>{if(!e.target.closest('.search'))hideSuggestions()});
catNav();renderHome();updateCart();syncLiveCatalog(true);
let logged=JSON.parse(localStorage.getItem('npt_customer')||'null');
if(logged){document.getElementById('accountText').textContent=(logged.name||'Account').split(' ')[0];refreshCustomerProfile();syncLiveCustomer(false);initBrowserPush()}
setTimeout(()=>{renderWelcome();document.getElementById('welcome').classList.remove('hide')},250);
function initShader(){
 const c=document.getElementById('shaderBg'); if(!c||c.dataset.ready)return; c.dataset.ready='1';
 const gl=c.getContext('webgl',{alpha:true,antialias:true}); if(!gl)return;
 const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
 const fs=`precision mediump float;uniform float t;uniform vec2 r;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=uv-.5;p.x*=r.x/r.y;float a=sin(length(p)*10.-t*0.5)*0.5+0.5;float b=sin((p.x+p.y)*5.+t*0.25)*0.5+0.5;float glow=smoothstep(.7,.05,length(p-vec2(.22,.12)))*.22+smoothstep(.5,.02,length(p+vec2(.28,.2)))*.12;float grain=h(gl_FragCoord.xy+t)*.035;vec3 col=vec3(.025,.075,.13)+vec3(.02,.06,.11)*(a*.55+b*.25)+vec3(1.,.78,.05)*glow;gl_FragColor=vec4(col,0.32+grain);}`;
 function sh(type,src){let x=gl.createShader(type);gl.shaderSource(x,src);gl.compileShader(x);return x}
 let pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
 let buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);let loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);let ut=gl.getUniformLocation(pr,'t'),ur=gl.getUniformLocation(pr,'r');
 function resize(){c.width=innerWidth*devicePixelRatio;c.height=innerHeight*devicePixelRatio;gl.viewport(0,0,c.width,c.height)} addEventListener('resize',resize);resize();let st=performance.now();function frame(n){gl.uniform1f(ut,(n-st)/1000);gl.uniform2f(ur,c.width,c.height);gl.drawArrays(gl.TRIANGLES,0,6);requestAnimationFrame(frame)}requestAnimationFrame(frame);
}
