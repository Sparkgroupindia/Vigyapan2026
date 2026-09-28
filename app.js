const C=window.VIGYAPAN_CONFIG||{};let DATA={};let CART=[];let heroTimer,phoneTimer,footerTimer;let galleryItems=[],galleryIndex=0;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);

async function api(body){if(!C.API_URL||C.API_URL.includes('PASTE_'))throw new Error('Apps Script URL is not configured.');const r=await fetch(C.API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});const j=await r.json();if(!j.ok)throw new Error(j.error||'Request failed');return j;}
document.addEventListener('DOMContentLoaded',()=>{
 $('#menuBtn').onclick=()=>$('#navlinks').classList.toggle('open');
 $('#cartButton').onclick=openCart;$('#cartClose').onclick=()=>$('#cartModal').classList.remove('show');
 $('#modalClose').onclick=closeMedia;$('#leadForm').onsubmit=submitLead;$('#orderForm').onsubmit=submitOrder;
 $('#year').textContent=new Date().getFullYear();setupPhoneSwipe();load();
});
async function load(){try{const r=await api({action:'bootstrap'});DATA=r.data;render();}catch(e){console.error(e);$('#heroText').textContent='Please configure the website backend URL.';}}

function mediaId(u){const m=String(u||'').match(/[?&]id=([A-Za-z0-9_-]+)/)||String(u||'').match(/\/d\/([A-Za-z0-9_-]+)/);return m?m[1]:'';}
function mediaUrl(u){u=String(u||'').trim();if(!u)return '';const id=mediaId(u);if(id&&(u.includes('drive.google.com')||u.includes('googleusercontent.com')||u.includes('docs.google.com')))return 'https://lh3.googleusercontent.com/d/'+id+'=w2000';return u;}
function mediaUrlAttr(u){return escAttr(mediaUrl(u));}
function imageFallback(el){
 const original=el.getAttribute('data-original')||el.src||'',id=mediaId(original),list=[];
 if(id){list.push('https://drive.google.com/thumbnail?id='+id+'&sz=w2000');list.push('https://drive.google.com/uc?export=view&id='+id);}
 const n=Number(el.dataset.fallback||0);if(n<list.length){el.dataset.fallback=String(n+1);el.src=list[n];}else{el.style.display='none';}
}
function render(){
 const s=DATA.settings||{};
 $('#brandName').textContent=s.brand_name||'Vigyapan';$('#footerName').textContent=s.brand_name||'Vigyapan';
 setLogo('#brandLogo',s.logo_url);setLogo('#aboutLogo',s.logo_url);setLogo('#footerLogo',s.logo_url);
 $('#heroTitle').textContent=s.hero_title||s.tagline||'';$('#heroText').textContent=s.hero_text||'';
 $('#aboutText').textContent=s.about_text||'';$('#footerText').textContent=s.footer_text||'';
 $('#topContact').textContent=[s.phone1,s.phone2].filter(Boolean).join('  •  ');$('#topEmail').textContent=s.email||'';
 const wa='https://wa.me/'+String(s.whatsapp||C.WHATSAPP||'').replace(/\D/g,'')+'?text='+encodeURIComponent('Hello Vigyapan, I want to enquire about your services.');
 $('#heroWA').href=wa;$('#contactPhones').innerHTML=[s.phone1,s.phone2].filter(Boolean).map(x=>`<a href="tel:${escAttr(x)}">${esc(x)}</a>`).join('<br>');
 $('#contactEmail').innerHTML=s.email?`<a href="mailto:${escAttr(s.email)}">${esc(s.email)}</a>`:'';$('#contactAddress').textContent=s.address||'';
 $('#mapFrame').src=normalizeMap(s.map_embed,s.address);
 renderSocials();renderServices();renderPlans();renderGallery();renderProducts();renderPhone();startHero();renderFooterSlider();renderFloatingContact();
}
function setLogo(sel,url){
 const img=$(sel),brandText=$('#brandName');if(!img)return;
 if(url){img.src=mediaUrl(url);img.setAttribute('data-original',url);img.style.display='block';if(img.id==='brandLogo')brandText.style.display='none';}
 else{img.style.display='none';if(img.id==='brandLogo')brandText.style.display='inline';}
}
function normalizeMap(u,address){
 u=String(u||'').trim();address=String(address||'').trim();
 if(!u&& !address)return 'about:blank';
 if(u&&/\/maps\/embed|output=embed/i.test(u))return u;
 const lat=u.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
 if(lat)return 'https://www.google.com/maps?q='+encodeURIComponent(lat[1]+','+lat[2])+'&output=embed';
 let q=u||address;
 if(q){try{const x=new URL(q);if(x.hostname.includes('google.')){const place=(x.pathname.split('/').filter(Boolean).pop()||'').replace(/\+/g,' ');q=place||address;}}catch(e){}}
 return 'https://www.google.com/maps?q='+encodeURIComponent(q)+'&output=embed';
}
function renderSocials(){
 const a=DATA.socials||[],valid=a.filter(x=>String(x.ACTIVE).toUpperCase()==='YES'&&x.URL);
 const make=x=>`<a class="social" href="${escAttr(x.URL)}" target="_blank" rel="noopener">${esc(x.LABEL||x.ICON||'Link')}</a>`;
 $('#socials').innerHTML=valid.map(make).join('');$('#footerSocials').innerHTML=$('#socials').innerHTML;
}
function renderServices(){
 const rows=(DATA.services||[]).filter(x=>x.TITLE);
 $('#servicesGrid').innerHTML=rows.map((x,i)=>`<article class="service service-click" onclick="openService(${i})">
 ${x.IMAGE_URL?`<img class="service-image" src="${mediaUrlAttr(x.IMAGE_URL)}" data-original="${escAttr(x.IMAGE_URL)}" onerror="imageFallback(this)">`:''}
 <div class="service-inner"><div class="service-icon">${esc(x.ICON||'◆')}</div><h3>${esc(x.TITLE)}</h3><p class="muted">${esc(x.DESCRIPTION||'')}</p><span class="service-more">View details →</span></div></article>`).join('');
 window._services=rows;
}
function openService(i){
 const x=(window._services||[])[i];if(!x)return;
 $('#serviceModalContent').innerHTML=`${x.IMAGE_URL?`<img class="service-modal-image" src="${mediaUrlAttr(x.IMAGE_URL)}" data-original="${escAttr(x.IMAGE_URL)}" onerror="imageFallback(this)">`:''}<div class="service-modal-copy"><div class="eyebrow">SERVICE</div><h2>${esc(x.TITLE)}</h2><p>${esc(x.DESCRIPTION||'')}</p><a class="btn btn-accent" target="_blank" href="${escAttr(waLink('Hello Vigyapan, I want details about '+x.TITLE+'.'))}">Enquire on WhatsApp</a></div>`;
 $('#serviceModal').classList.add('show');
}
function closeService(){$('#serviceModal').classList.remove('show');}
function money(x){return x!==''&&x!==null&&x!==undefined?'₹'+Number(x).toLocaleString('en-IN'):'';}
function renderPlans(){
 $('#plansGrid').innerHTML=(DATA.plans||[]).map(x=>{const f=String(x.FEATURES||'').split('|').map(v=>v.trim()).filter(Boolean);let price='';
 if(String(x.SHOW_PRICE).toUpperCase()==='YES')price=`<div class="price">${x.OLD_PRICE?`<span class="old">${money(x.OLD_PRICE)}</span>`:''}${money(x.PRICE)}</div>`;
 return `<article class="plan ${x.HIGHLIGHT?'highlight':''}"><div class="plan-top"><span class="plan-month">${esc(x.MONTHS||'')} ${Number(x.MONTHS)===1?'Month':'Months'}</span>${x.HIGHLIGHT?'<span class="badge">POPULAR</span>':''}</div><h3>${esc(x.TITLE)}</h3>${x.OFFER_TEXT?`<span class="offer">${esc(x.OFFER_TEXT)}</span>`:''}${price}<ul class="features">${f.map(v=>`<li><span class="tick">✓</span><span>${esc(v)}</span></li>`).join('')}</ul><button class="btn btn-dark planWA" data-plan="${escAttr(x.TITLE)}">Enquire on WhatsApp</button></article>`}).join('');
 $$('.planWA').forEach(b=>b.onclick=()=>waText(`Hello Vigyapan, I want details for the "${b.dataset.plan}" package.`));
}
function validGallery(){return (DATA.gallery||[]).filter(x=>x.URL&&String(x.ACTIVE||'YES').toUpperCase()==='YES');}
function renderGallery(){
 galleryItems=validGallery();const imgs=galleryItems.filter(x=>!String(x.TYPE).toLowerCase().includes('video')&&x.URL),vids=galleryItems.filter(x=>String(x.TYPE).toLowerCase().includes('video')&&x.URL);
 const block=(arr,isV)=>arr.map((x,i)=>{const u=isV?x.URL:mediaUrl(x.URL);return `<div class="gallery-item" onclick="openGallery(${galleryItems.indexOf(x)})">${isV?`<video src="${escAttr(u)}" muted preload="metadata"></video><span class="play">▶</span><span class="media-label">VIDEO</span>`:`<img src="${escAttr(u)}" data-original="${escAttr(x.URL)}" onerror="imageFallback(this)" loading="lazy" alt="${escAttr(x.TITLE)}">`}<div class="gallery-caption">${esc(x.TITLE||'')}</div></div>`}).join('');
 $('#galleryImages').innerHTML=imgs.length?block(imgs,false):'<div class="empty-media">No images uploaded yet.</div>';
 $('#galleryVideos').innerHTML=vids.length?block(vids,true):'<div class="empty-media">No videos uploaded yet.</div>';
 $('#galleryImageWrap').style.display=imgs.length?'block':'none';$('#galleryVideoWrap').style.display=vids.length?'block':'none';
}
function openGallery(index){galleryIndex=index;showGalleryItem();}
function showGalleryItem(){
 const x=galleryItems[galleryIndex];if(!x)return;const isV=String(x.TYPE).toLowerCase().includes('video'),u=isV?x.URL:mediaUrl(x.URL);
 $('#modalContent').innerHTML=isV?`<video class="lightbox-media" src="${escAttr(u)}" controls autoplay playsinline></video>`:`<img class="lightbox-media" src="${escAttr(u)}" data-original="${escAttr(x.URL)}" onerror="imageFallback(this)">`;
 $('#mediaTitle').textContent=x.TITLE||'';$('#mediaCounter').textContent=(galleryIndex+1)+' / '+galleryItems.length;$('#mediaModal').classList.add('show');
}
function galleryNext(d){if(!galleryItems.length)return;galleryIndex=(galleryIndex+d+galleryItems.length)%galleryItems.length;showGalleryItem();}
function closeMedia(){const v=$('#modalContent video');if(v)v.pause();$('#mediaModal').classList.remove('show');}
function renderProducts(){
 $('#productsGrid').innerHTML=(DATA.products||[]).filter(x=>x.NAME).map(x=>{
 const imgs=[x.IMAGE_URL,x.IMAGE_URL_2,x.IMAGE_URL_3,x.IMAGE_URL_4,x.IMAGE_URL_5].filter(Boolean),u=mediaUrl(imgs[0]||'');
 return `<article class="product" data-product="${escAttr(x.ID)}"><div class="product-media"><img src="${escAttr(u)}" data-original="${escAttr(imgs[0]||'')}" onerror="imageFallback(this)" loading="lazy">${imgs.length>1?`<span class="image-count">${imgs.length} Photos</span>`:''}</div><div class="product-body"><h3>${esc(x.NAME)}</h3><p class="muted">${esc(x.DESCRIPTION||'')}</p>${x.PRICE!==''?`<div class="product-price">${money(x.PRICE)}</div>`:''}<div class="product-actions"><button class="btn btn-dark" onclick="addCart('${escAttr(x.ID)}')">Add to Cart</button><button class="btn product-view" onclick="openProduct('${escAttr(x.ID)}')">View Photos</button></div></div></article>`;
 }).join('');
}
function openProduct(id){
 const x=(DATA.products||[]).find(p=>p.ID===id);if(!x)return;const imgs=[x.IMAGE_URL,x.IMAGE_URL_2,x.IMAGE_URL_3,x.IMAGE_URL_4,x.IMAGE_URL_5].filter(Boolean);
 $('#productModalContent').innerHTML=imgs.length?`<div class="product-lightbox">${imgs.map((u,i)=>`<img class="${i===0?'active':''}" src="${mediaUrlAttr(u)}" data-original="${escAttr(u)}" onerror="imageFallback(this)">`).join('')}</div><h2>${esc(x.NAME)}</h2><p>${esc(x.DESCRIPTION||'')}</p>`:`<div class="empty-media">No product images uploaded.</div>`;
 $('#productModal').classList.add('show');let i=0;const list=$$('#productModalContent .product-lightbox img');if(list.length>1){$('#productPrev').style.display='grid';$('#productNext').style.display='grid';$('#productPrev').onclick=()=>{list[i].classList.remove('active');i=(i-1+list.length)%list.length;list[i].classList.add('active')};$('#productNext').onclick=()=>{list[i].classList.remove('active');i=(i+1)%list.length;list[i].classList.add('active')}}else{$('#productPrev').style.display='none';$('#productNext').style.display='none';}
}
function closeProduct(){$('#productModal').classList.remove('show');}
function renderPhone(){
 const imgs=(DATA.gallery||[]).filter(x=>x.URL&&!String(x.TYPE).toLowerCase().includes('video')).map(x=>x.URL).filter(Boolean).slice(0,12);
 $('#phoneScreen').innerHTML=imgs.map((u,i)=>`<img src="${mediaUrlAttr(u)}" data-original="${escAttr(u)}" onerror="imageFallback(this)" class="${i===0?'active':''}">`).join('');
 $('#phoneDots').innerHTML=imgs.map((_,i)=>`<span class="${i===0?'active':''}"></span>`).join('');
 if(phoneTimer)clearInterval(phoneTimer);let i=0;if(imgs.length>1)phoneTimer=setInterval(()=>phoneGo((i+1)%imgs.length),2800);
 window._phoneImages=imgs;
}
function phoneGo(i){const a=$$('#phoneScreen img'),d=$$('#phoneDots span');if(!a.length)return;a.forEach(x=>x.classList.remove('active'));d.forEach(x=>x.classList.remove('active'));a[i]?.classList.add('active');d[i]?.classList.add('active');window._phoneIndex=i;}
function setupPhoneSwipe(){
 const el=$('#phoneScreen');let sx=0;el.addEventListener('touchstart',e=>sx=e.changedTouches[0].clientX,{passive:true});
 el.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>40){const n=window._phoneImages?.length||0;if(n)phoneGo(((window._phoneIndex||0)+(dx<0?1:-1)+n)%n);}});
}
function startHero(){
 const s=DATA.settings||{},u=s.hero_image_url||'';
 const el=$('#heroSlides');if(heroTimer)clearInterval(heroTimer);
 el.innerHTML=u?`<div class="hero-slide active" style="background-image:url('${escAttr(mediaUrl(u))}')"></div>`:'';
}
function renderFooterSlider(){
 const urls=String((DATA.settings||{}).footer_slider_urls||'').split('|').map(x=>x.trim()).filter(Boolean);
 const el=$('#footerSlider'),dots=$('#footerDots');if(footerTimer)clearInterval(footerTimer);
 el.innerHTML=urls.map((u,i)=>`<div class="footer-slide ${i===0?'active':''}"><img src="${mediaUrlAttr(u)}" data-original="${escAttr(u)}" onerror="imageFallback(this)"></div>`).join('');
 dots.innerHTML=urls.map((_,i)=>`<span class="${i===0?'active':''}"></span>`).join('');
 if(urls.length>1){let i=0;footerTimer=setInterval(()=>{const a=$$('#footerSlider .footer-slide'),d=$$('#footerDots span');a[i].classList.remove('active');d[i].classList.remove('active');i=(i+1)%a.length;a[i].classList.add('active');d[i].classList.add('active')},3000);}
}
function waLink(t){return 'https://wa.me/'+String((DATA.settings||{}).whatsapp||C.WHATSAPP||'').replace(/\D/g,'')+'?text='+encodeURIComponent(t);}
function waText(t){window.open(waLink(t),'_blank')}
function renderFloatingContact(){
 const s=DATA.settings||{},items=[];
 if(s.phone1)items.push(`<a href="tel:${escAttr(s.phone1)}" aria-label="Call">☎</a>`);
 if(s.phone2)items.push(`<a href="tel:${escAttr(s.phone2)}" aria-label="Call 2">☎</a>`);
 if(s.whatsapp||C.WHATSAPP)items.push(`<a href="${escAttr(waLink('Hello Vigyapan'))}" target="_blank" aria-label="WhatsApp">◉</a>`);
 if(s.facebook)items.push(`<a href="${escAttr(s.facebook)}" target="_blank" aria-label="Facebook">f</a>`);
 if(s.instagram)items.push(`<a href="${escAttr(s.instagram)}" target="_blank" aria-label="Instagram">◎</a>`);
 if(s.email)items.push(`<a href="mailto:${escAttr(s.email)}" aria-label="Email">✉</a>`);
 $('#contactFloatMenu').innerHTML=items.join('');$('#contactFloat').classList.toggle('has-items',items.length>0);
}
function toggleContact(){ $('#contactFloat').classList.toggle('open');}
async function submitLead(e){e.preventDefault();const f=new FormData(e.target);$('#leadMsg').textContent='Sending...';try{await api({action:'saveLead',name:f.get('name'),phone:f.get('phone'),email:f.get('email'),message:f.get('message')});$('#leadMsg').textContent='Enquiry saved. Thank you!';e.target.reset();}catch(x){$('#leadMsg').textContent=x.message;}}
function addCart(id){const p=(DATA.products||[]).find(x=>x.ID===id);if(!p)return;CART.push(p);$('#cartCount').textContent=CART.length;openCart();}
function openCart(){$('#cartItems').innerHTML=CART.length?CART.map((p,i)=>`<div class="cart-row"><span>${esc(p.NAME)}</span><button onclick="CART.splice(${i},1);$('#cartCount').textContent=CART.length;openCart()">Remove</button></div>`).join(''):'<p class="muted">Your cart is empty.</p>';$('#cartModal').classList.add('show');}
async function submitOrder(e){e.preventDefault();if(!CART.length){alert('Cart is empty');return}const f=new FormData(e.target),s=DATA.settings||{},msg=s.order_note||'Hello Vigyapan, I want to enquire about these products:',items=CART.map(x=>x.NAME+(x.PRICE?` - ₹${x.PRICE}`:'')).join('\n'),full=`${msg}\n\n${items}\n\nName: ${f.get('name')}\nPhone: ${f.get('phone')}\nMessage: ${f.get('note')||''}`;try{await api({action:'saveOrder',name:f.get('name'),phone:f.get('phone'),items:CART.map(x=>({id:x.ID,name:x.NAME,price:x.PRICE||''})),total:CART.reduce((n,x)=>n+(Number(x.PRICE)||0),0),message:full});}catch(x){}waText(full);$('#cartModal').classList.remove('show');}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escAttr(v){return esc(v).replace(/`/g,'&#96;')}
