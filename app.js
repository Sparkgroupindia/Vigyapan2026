const C=window.VIGYAPAN_CONFIG||{};
let DATA={};let CART=[];let heroTimer=null;let phoneTimer=null;
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

async function api(body){
  if(!C.API_URL||C.API_URL.includes('PASTE_')) throw new Error('Apps Script Web App URL is not configured.');
  const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
  const j=await r.json();if(!j.ok)throw new Error(j.error||'Request failed');return j;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function attr(v){return esc(v).replace(/`/g,'&#96;')}
function driveId(u){const s=String(u||'');let m=s.match(/[?&]id=([\w-]+)/);if(m)return m[1];m=s.match(/\/d\/([\w-]+)/);return m?m[1]:''}
function imageCandidates(url){
  const id=driveId(url);if(!id)return [String(url||'')].filter(Boolean);
  return [
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    `https://lh3.googleusercontent.com/d/${id}=w2000`,
    `https://drive.google.com/uc?export=view&id=${id}`
  ];
}
function mediaImg(url,extra=''){
  const list=imageCandidates(url);return `<img ${extra} src="${attr(list[0])}" data-fallbacks='${attr(JSON.stringify(list.slice(1)))}' onerror="fallbackImage(this)">`;
}
function fallbackImage(el){try{const a=JSON.parse(el.dataset.fallbacks||'[]');if(a.length){el.src=a.shift();el.dataset.fallbacks=JSON.stringify(a);return;}}catch(e){}el.classList.add('broken-media')}
function mediaVideo(url){const id=driveId(url);const src=id?`https://drive.google.com/uc?export=view&id=${id}`:url;return src}

function init(){
  $('#menuBtn').onclick=()=>$('#navlinks').classList.toggle('open');
  $('#cartButton').onclick=openCart;$('#cartClose').onclick=()=>$('#cartModal').classList.remove('show');
  $('#modalClose').onclick=()=>$('#mediaModal').classList.remove('show');
  $('#leadForm').onsubmit=submitLead;$('#orderForm').onsubmit=submitOrder;
  $('#year').textContent=new Date().getFullYear();load();
}
async function load(){try{const r=await api({action:'bootstrap'});DATA=r.data||{};render();}catch(e){console.error(e);$('#heroTitle').textContent='Please configure the website backend.';$('#heroText').textContent=e.message;}}
function render(){
  const s=DATA.settings||{};
  $('#brandName').textContent=s.brand_name||'Vigyapan';$('#footerName').textContent=s.brand_name||'Vigyapan';
  setImage($('#brandLogo'),s.logo_url,true);setImage($('#footerImage'),s.footer_image_url,true);
  $('#heroTitle').textContent=s.hero_title||s.tagline||'Where Brands gets Noticed';$('#heroText').textContent=s.hero_text||'';
  $('#aboutTitle').textContent=s.about_title||'About Vigyapan';$('#aboutText').textContent=s.about_text||'';$('#footerText').textContent=s.footer_text||'';
  $('#topContact').textContent=[s.phone1,s.phone2].filter(Boolean).join('  •  ');$('#topEmail').textContent=s.email||'';
  const wa='https://wa.me/'+String(s.whatsapp||C.WHATSAPP||'').replace(/\D/g,'')+'?text='+encodeURIComponent('Hello Vigyapan, I want to enquire about your services.');$('#heroWA').href=wa;$('#floatingWA').href=wa;
  $('#contactPhones').innerHTML=[s.phone1,s.phone2].filter(Boolean).map(x=>`<a href="tel:${attr(x)}">${esc(x)}</a>`).join('<br>');
  $('#contactEmail').innerHTML=s.email?`<a href="mailto:${attr(s.email)}">${esc(s.email)}</a>`:'';$('#contactAddress').textContent=s.address||'';
  $('#mapLink').href=s.map_embed||'#';$('#mapFrame').src=normalizeMap(s.map_embed);
  renderSocials();renderServices();renderPlans();renderGallery();renderProducts();renderPhone();startHero();
}
function setImage(el,url,hideIfEmpty){if(!el)return;if(!url){if(hideIfEmpty)el.style.display='none';return;}el.style.display='block';const a=imageCandidates(url);el.src=a[0];el.dataset.fallbacks=JSON.stringify(a.slice(1));el.onerror=()=>fallbackImage(el);}
function normalizeMap(u){if(!u)return'about:blank';try{const x=new URL(u);if(x.hostname.includes('google.')&&x.pathname.includes('/maps')){if(!x.searchParams.get('output'))x.searchParams.set('output','embed');return x.toString();}}catch(e){}return u;}
function renderSocials(){const a=DATA.socials||[];const h=a.filter(x=>String(x.ACTIVE).toUpperCase()==='YES'&&x.URL).map(x=>`<a class="social" href="${attr(x.URL)}" target="_blank" rel="noopener">${esc(x.LABEL)}</a>`).join('');$('#socials').innerHTML=h;$('#footerSocials').innerHTML=h;}
function renderServices(){$('#servicesGrid').innerHTML=(DATA.services||[]).map(x=>`<article class="service reveal"><div class="service-icon">${esc(x.ICON||'✦')}</div><h3>${esc(x.TITLE)}</h3><p>${esc(x.DESCRIPTION||'')}</p><span class="service-arrow">↗</span></article>`).join('');}
function money(x){if(x===''||x===null||x===undefined)return'';return'₹'+Number(x).toLocaleString('en-IN');}
function renderPlans(){
  $('#plansGrid').innerHTML=(DATA.plans||[]).map(x=>{const f=String(x.FEATURES||'').split('|').filter(Boolean);const price=String(x.SHOW_PRICE).toUpperCase()==='YES'?`<div class="price-row">${x.OLD_PRICE?`<span class="old">${money(x.OLD_PRICE)}</span>`:''}<strong>${money(x.PRICE)}</strong></div>`:'';return `<article class="plan reveal ${String(x.HIGHLIGHT).trim()?'featured':''}">${x.HIGHLIGHT?`<span class="plan-badge">${esc(x.HIGHLIGHT)}</span>`:''}<div class="plan-top"><span>${String(x.MONTHS||'')} ${Number(x.MONTHS)===1?'MONTH':'MONTHS'}</span></div><h3>${esc(x.TITLE)}</h3>${x.OFFER_TEXT?`<div class="offer">${esc(x.OFFER_TEXT)}</div>`:''}${price}<ul>${f.map(v=>`<li><span>✓</span>${esc(v)}</li>`).join('')}</ul><button class="plan-btn" data-plan="${attr(x.TITLE)}">Enquire on WhatsApp <span>↗</span></button></article>`}).join('');
  $$('.plan-btn').forEach(b=>b.onclick=()=>waText(`Hello Vigyapan, I want details for the "${b.dataset.plan}" package.`));
}
function renderGallery(){
  const a=DATA.gallery||[];$('#galleryGrid').innerHTML=a.map((x,i)=>{const v=String(x.TYPE||'').toLowerCase().includes('video');const src=x.THUMB_URL||x.URL;return `<div class="gallery-item reveal" data-gallery="${i}">${v?`<div class="video-thumb">${mediaImg(src,'alt="'+attr(x.TITLE)+'"')}<span class="play">▶</span></div>`:mediaImg(src,'loading="lazy" alt="'+attr(x.TITLE)+'"')}<div class="gallery-caption"><span>${esc(x.TITLE||'')}</span><b>↗</b></div></div>`}).join('');
  $$('#galleryGrid .gallery-item').forEach(el=>el.onclick=()=>{const x=a[Number(el.dataset.gallery)];openMedia(x.URL||x.THUMB_URL,x.TYPE,x.TITLE);});
}
function renderProducts(){
  const a=DATA.products||[];$('#productsGrid').innerHTML=a.map(x=>`<article class="product reveal"><div class="product-media">${x.IMAGE_URL?mediaImg(x.IMAGE_URL,'loading="lazy" alt="'+attr(x.NAME)+'"'): '<div class="no-image">VIGYAPAN</div>'}</div><div class="product-body"><span class="category">${esc(x.CATEGORY||'PRODUCT')}</span><h3>${esc(x.NAME)}</h3><p>${esc(x.DESCRIPTION||'')}</p>${x.PRICE!==''?`<div class="product-price">${money(x.PRICE)} ${x.OLD_PRICE?`<span>${money(x.OLD_PRICE)}</span>`:''}</div>`:''}<div class="product-actions"><button class="dark-btn" data-add="${attr(x.ID)}">Add to Cart</button><button class="light-btn" data-wa-product="${attr(x.NAME)}">WhatsApp</button></div></div></article>`).join('');
  $$('#productsGrid [data-add]').forEach(b=>b.onclick=()=>addCart(b.dataset.add));$$('#productsGrid [data-wa-product]').forEach(b=>b.onclick=()=>waText(`Hello Vigyapan, I want details about ${b.dataset.waProduct}.`));
}
function renderPhone(){const imgs=(DATA.gallery||[]).filter(x=>!String(x.TYPE||'').toLowerCase().includes('video')).map(x=>x.THUMB_URL||x.URL).filter(Boolean).slice(0,8);$('#phoneScreen').innerHTML=imgs.map((u,i)=>mediaImg(u,`class="${i===0?'active':''}"`)).join('');if(phoneTimer)clearInterval(phoneTimer);if(imgs.length>1){let i=0;phoneTimer=setInterval(()=>{const a=$$('#phoneScreen img');if(!a.length)return;a[i].classList.remove('active');i=(i+1)%a.length;a[i].classList.add('active');},2600);}}
function startHero(){const urls=(DATA.gallery||[]).filter(x=>!String(x.TYPE||'').toLowerCase().includes('video')).map(x=>x.THUMB_URL||x.URL).filter(Boolean).slice(0,6);const el=$('#heroSlides');el.innerHTML=urls.map((u,i)=>`<div class="hero-slide ${i===0?'active':''}"><img src="${attr(imageCandidates(u)[0])}" data-fallbacks='${attr(JSON.stringify(imageCandidates(u).slice(1)))}' onerror="fallbackImage(this)"></div>`).join('');if(heroTimer)clearInterval(heroTimer);if(urls.length>1){let i=0;heroTimer=setInterval(()=>{const a=$$('#heroSlides .hero-slide');if(!a.length)return;a[i].classList.remove('active');i=(i+1)%a.length;a[i].classList.add('active');},4000);}}
function waText(t){const n=String((DATA.settings||{}).whatsapp||C.WHATSAPP||'').replace(/\D/g,'');window.open('https://wa.me/'+n+'?text='+encodeURIComponent(t),'_blank');}
async function submitLead(e){e.preventDefault();const f=new FormData(e.target);$('#leadMsg').textContent='Sending...';try{await api({action:'saveLead',name:f.get('name'),phone:f.get('phone'),email:f.get('email'),message:f.get('message')});$('#leadMsg').textContent='Enquiry received. Thank you!';e.target.reset();}catch(x){$('#leadMsg').textContent=x.message;}}
function addCart(id){const p=(DATA.products||[]).find(x=>x.ID===id);if(!p)return;CART.push(p);$('#cartCount').textContent=CART.length;openCart();}
function openCart(){$('#cartItems').innerHTML=CART.length?CART.map((p,i)=>`<div class="cart-line"><span>${esc(p.NAME)}</span><button onclick="CART.splice(${i},1);$('#cartCount').textContent=CART.length;openCart()">Remove</button></div>`).join(''):'<p class="muted">Your cart is empty.</p>';$('#cartModal').classList.add('show');}
async function submitOrder(e){e.preventDefault();if(!CART.length){alert('Cart is empty');return;}const f=new FormData(e.target);const intro=(DATA.settings||{}).order_note||'Hello Vigyapan, I want to enquire about these products:';const items=CART.map(x=>x.NAME+(x.PRICE?` - ₹${x.PRICE}`:'')).join('\n');const full=`${intro}\n\n${items}\n\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nMessage: ${f.get('note')||''}`;try{await api({action:'saveOrder',name:f.get('name'),phone:f.get('phone'),items:CART.map(x=>({id:x.ID,name:x.NAME,price:x.PRICE||''})),total:CART.reduce((n,x)=>n+(Number(x.PRICE)||0),0),message:full});}catch(x){}waText(full);$('#cartModal').classList.remove('show');}
function openMedia(url,type,title){const isV=String(type||'').toLowerCase().includes('video');const src=isV?mediaVideo(url):imageCandidates(url)[0];$('#modalContent').innerHTML=isV?`<video src="${attr(src)}" controls autoplay style="max-width:100%;max-height:78vh"></video><h3>${esc(title||'')}</h3>`:`<img src="${attr(src)}" data-fallbacks='${attr(JSON.stringify(imageCandidates(url).slice(1)))}' onerror="fallbackImage(this)" style="max-width:100%;max-height:78vh;object-fit:contain"><h3>${esc(title||'')}</h3>`;$('#mediaModal').classList.add('show');}

document.addEventListener('DOMContentLoaded',init);
