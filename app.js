const C=window.VIGYAPAN_CONFIG||{}; let DATA={}; let CART=[]; let heroTimer,phoneTimer;
const $=s=>document.querySelector(s);
async function api(body){
  if(!C.API_URL || C.API_URL.includes('PASTE_')) throw new Error('Apps Script URL is not configured.');
  const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
  const j=await r.json(); if(!j.ok) throw new Error(j.error||'Request failed'); return j;
}
document.addEventListener('DOMContentLoaded',()=>{ $('#menuBtn').onclick=()=>$('#navlinks').classList.toggle('open'); $('#cartButton').onclick=openCart; $('#cartClose').onclick=()=>$('#cartModal').classList.remove('show'); $('#modalClose').onclick=()=>$('#mediaModal').classList.remove('show'); $('#leadForm').onsubmit=submitLead; $('#orderForm').onsubmit=submitOrder; $('#year').textContent=new Date().getFullYear(); load();});
async function load(){try{const r=await api({action:'bootstrap'});DATA=r.data;render();}catch(e){console.error(e);$('#heroText').textContent='Please configure the website backend URL.';}}
function mediaUrl(u){
  u=String(u||'');
  if(!u) return '';
  // Convert old Google Drive image URLs saved by V1 to the more reliable
  // googleusercontent image endpoint. Videos continue to use their direct URL.
  const m=u.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if((u.includes('drive.google.com')||u.includes('docs.google.com')) && m){
    return 'https://lh3.googleusercontent.com/d/'+m[1]+'=w2000';
  }
  return u;
}
function mediaUrlAttr(u){ return escAttr(mediaUrl(u)); }
function imageFallback(el){
  const list=[];
  const original=el.getAttribute('data-original')||el.src||'';
  const id=(original.match(/[?&]id=([A-Za-z0-9_-]+)/)||[])[1];
  if(id){
    list.push('https://drive.google.com/thumbnail?id='+id+'&sz=w1600');
    list.push('https://drive.google.com/uc?export=view&id='+id);
  }
  const next=Number(el.dataset.fallback||0);
  if(next<list.length){ el.dataset.fallback=String(next+1); el.src=list[next]; }
  else { el.style.display='none'; }
}
function render(){
 const s=DATA.settings||{}; $('#brandName').textContent=s.brand_name||'Vigyapan'; $('#footerName').textContent=s.brand_name||'Vigyapan';
 if(s.logo_url){$('#brandLogo').src=mediaUrl(s.logo_url);$('#brandLogo').setAttribute('data-original',s.logo_url);$('#brandLogo').style.display='block';} else $('#brandLogo').style.display='none';
 $('#heroTitle').textContent=s.hero_title||s.tagline||''; $('#heroText').textContent=s.hero_text||'';
 $('#aboutTitle').textContent=s.about_title||'About Us'; $('#aboutText').textContent=s.about_text||'';
 $('#footerText').textContent=s.footer_text||''; if(s.footer_image_url){$('#footerImage').src=mediaUrl(s.footer_image_url);$('#footerImage').setAttribute('data-original',s.footer_image_url);$('#footerImage').style.display='block'} else $('#footerImage').style.display='none'; $('#topContact').textContent=[s.phone1,s.phone2].filter(Boolean).join('  •  '); $('#topEmail').textContent=s.email||'';
 const wa='https://wa.me/'+String(s.whatsapp||C.WHATSAPP||'').replace(/\D/g,'')+'?text='+encodeURIComponent('Hello Vigyapan, I want to enquire about your services.');
 $('#heroWA').href=wa; $('#floatingWA').href=wa;
 $('#contactPhones').innerHTML=[s.phone1,s.phone2].filter(Boolean).map(x=>`<a href="tel:${x}">${x}</a>`).join('<br>');
 $('#contactEmail').innerHTML=s.email?`<a href="mailto:${s.email}">${s.email}</a>`:'';
 $('#contactAddress').textContent=s.address||''; $('#mapLink').href=s.map_embed||'#'; $('#mapFrame').src=normalizeMap(s.map_embed);
 renderSocials(); renderServices(); renderPlans(); renderGallery(); renderProducts(); renderPhone();
}
function normalizeMap(u){if(!u)return 'about:blank';try{const x=new URL(u);if(x.hostname.includes('google.')&&x.pathname.includes('/maps')){if(!x.searchParams.get('output'))x.searchParams.set('output','embed');return x.toString();}}catch(e){}return u;}
function renderSocials(){const a=DATA.socials||[]; const make=x=>`<a class="social" href="${esc(x.URL)}" target="_blank">${esc(x.LABEL)}</a>`; $('#socials').innerHTML=a.filter(x=>x.ACTIVE==='YES'&&x.URL).map(make).join(''); $('#footerSocials').innerHTML=$('#socials').innerHTML;}
function renderServices(){ $('#servicesGrid').innerHTML=(DATA.services||[]).map(x=>`<article class="service"><div class="service-icon">${esc(x.ICON||'◆')}</div><h3>${esc(x.TITLE)}</h3><p class="muted">${esc(x.DESCRIPTION||'')}</p></article>`).join('');}
function money(x){return x!==''&&x!==null&&x!==undefined ? '₹'+Number(x).toLocaleString('en-IN') : '';}
function renderPlans(){ $('#plansGrid').innerHTML=(DATA.plans||[]).map(x=>{const features=String(x.FEATURES||'').split('|').filter(Boolean); let price=''; if(String(x.SHOW_PRICE).toUpperCase()==='YES') price=`<div class="price">${x.OLD_PRICE?`<span class="old">${money(x.OLD_PRICE)}</span>`:''}${money(x.PRICE)}</div>`; return `<article class="plan ${x.HIGHLIGHT?'highlight':''}">${x.HIGHLIGHT?'<span class="badge">HIGHLIGHT</span>':''}<h3>${esc(x.TITLE)}</h3>${x.OFFER_TEXT?`<span class="offer">${esc(x.OFFER_TEXT)}</span>`:''}${price}<ul class="features">${features.map(f=>`<li>✓ ${esc(f)}</li>`).join('')}</ul><button class="btn btn-dark planWA" data-plan="${esc(x.TITLE)}">Enquire on WhatsApp</button></article>`}).join('');
 document.querySelectorAll('.planWA').forEach(b=>b.onclick=()=>waText(`Hello Vigyapan, I want details for the "${b.dataset.plan}" package.`));
}
function renderGallery(){const a=DATA.gallery||[]; $('#galleryGrid').innerHTML=a.map(x=>{const isV=String(x.TYPE).toLowerCase().includes('video');const u=isV?x.URL:mediaUrl(x.URL);return `<div class="gallery-item" onclick="openMedia('${escAttr(u)}','${escAttr(x.TYPE)}','${escAttr(x.TITLE)}')">${isV?`<video src="${esc(x.URL)}" muted></video><span class="play">▶</span>`:`<img src="${escAttr(u)}" data-original="${escAttr(x.URL)}" onerror="imageFallback(this)" loading="lazy" alt="${esc(x.TITLE)}">`}</div>`}).join('');}
function renderProducts(){const a=DATA.products||[]; $('#productsGrid').innerHTML=a.map(x=>{const u=mediaUrl(x.IMAGE_URL||'');return `<article class="product"><img src="${escAttr(u)}" data-original="${escAttr(x.IMAGE_URL||'')}" onerror="imageFallback(this)" loading="lazy"><div class="product-body"><h3>${esc(x.NAME)}</h3><p class="muted">${esc(x.DESCRIPTION||'')}</p>${x.PRICE!==''?`<div class="product-price">${money(x.PRICE)}</div>`:''}<div class="product-actions"><button class="btn btn-dark" onclick="addCart('${escAttr(x.ID)}')">Add to Cart</button><button class="btn" style="background:#eee" onclick="waText('Hello Vigyapan, I want details for ${esc(x.NAME)}.')">WhatsApp</button></div></div></article>`}).join('');}
function renderPhone(){const imgs=(DATA.gallery||[]).filter(x=>String(x.TYPE).toLowerCase().includes('image')||!x.TYPE).map(x=>x.URL).filter(Boolean).slice(0,8); $('#phoneScreen').innerHTML=imgs.map((u,i)=>`<img src="${mediaUrlAttr(u)}" data-original="${escAttr(u)}" onerror="imageFallback(this)" class="${i===0?'active':''}">`).join(''); if(phoneTimer)clearInterval(phoneTimer); if(imgs.length>1){let i=0;phoneTimer=setInterval(()=>{const a=$$('#phoneScreen img');if(!a.length)return;a[i].classList.remove('active');i=(i+1)%a.length;a[i].classList.add('active')},2600)}}
function startHero(){const urls=(DATA.gallery||[]).filter(x=>String(x.TYPE).toLowerCase().includes('image')).map(x=>mediaUrl(x.URL)).filter(Boolean).slice(0,6); const el=$('#heroSlides'); el.innerHTML=urls.map((u,i)=>`<div class="hero-slide ${i===0?'active':''}" style="background-image:url('${escAttr(u)}')"></div>`).join(''); if(heroTimer)clearInterval(heroTimer); if(urls.length>1){let i=0;heroTimer=setInterval(()=>{const a=$$('#heroSlides .hero-slide');a[i].classList.remove('active');i=(i+1)%a.length;a[i].classList.add('active')},3500)}}
function renderHeroAfter(){startHero()} const oldRender=render; render=function(){oldRender();startHero();}
function waText(t){const s=DATA.settings||{};const n=String(s.whatsapp||C.WHATSAPP||'').replace(/\D/g,'');window.open('https://wa.me/'+n+'?text='+encodeURIComponent(t),'_blank')}
async function submitLead(e){e.preventDefault();const f=new FormData(e.target);$('#leadMsg').textContent='Sending...';try{await api({action:'saveLead',name:f.get('name'),phone:f.get('phone'),email:f.get('email'),message:f.get('message')});$('#leadMsg').textContent='Enquiry saved. Thank you!';e.target.reset();}catch(x){$('#leadMsg').textContent=x.message;}}
function addCart(id){const p=(DATA.products||[]).find(x=>x.ID===id);if(!p)return;CART.push(p);$('#cartCount').textContent=CART.length;openCart();}
function openCart(){$('#cartItems').innerHTML=CART.length?CART.map((p,i)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #eee"><span>${esc(p.NAME)}</span><button onclick="CART.splice(${i},1);$('#cartCount').textContent=CART.length;openCart()">Remove</button></div>`).join(''):'<p class="muted">Your cart is empty.</p>';$('#cartModal').classList.add('show');}
async function submitOrder(e){e.preventDefault();if(!CART.length){alert('Cart is empty');return}const f=new FormData(e.target);const msg=(DATA.settings||{}).order_note||'Hello Vigyapan, I want to enquire about these products:';const items=CART.map(x=>x.NAME+(x.PRICE?` - ₹${x.PRICE}`:'')).join('\n');const full=`${msg}\n\n${items}\n\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nMessage: ${f.get('note')||''}`;try{await api({action:'saveOrder',name:f.get('name'),phone:f.get('phone'),items:CART.map(x=>({id:x.ID,name:x.NAME,price:x.PRICE||''})),total:CART.reduce((n,x)=>n+(Number(x.PRICE)||0),0),message:full});}catch(x){}waText(full);$('#cartModal').classList.remove('show');}
function openMedia(url,type,title){const isV=String(type).toLowerCase().includes('video');const u=isV?url:mediaUrl(url);$('#modalContent').innerHTML=isV?`<video src="${esc(u)}" controls autoplay style="max-height:80vh"></video><h3>${esc(title||'')}</h3>`:`<img src="${esc(u)}" data-original="${escAttr(url)}" onerror="imageFallback(this)" style="max-height:80vh;object-fit:contain"><h3>${esc(title||'')}</h3>`;$('#mediaModal').classList.add('show')}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escAttr(v){return esc(v).replace(/`/g,'&#96;')}
function $$(s){return document.querySelectorAll(s)}
