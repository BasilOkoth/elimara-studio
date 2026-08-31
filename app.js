
const products = {
  nb01: {
    id:'nb01', title:'Nebula I — Emergence', price:28000, image:'assets/nebula-emergence.png',
    editionSize:25, sold:3, code:'ELA-NB01', year:2026, dimensions:'700 × 1000 mm',
    medium:'Archival pigment print on 100% cotton rag'
  },
  nb02: {
    id:'nb02', title:'Nebula II — Convergence', price:28000, image:'assets/nebula-convergence.png',
    editionSize:25, sold:1, code:'ELA-NB02', year:2026, dimensions:'700 × 1000 mm',
    medium:'Archival pigment print on 100% cotton rag'
  }
};
let cart = JSON.parse(localStorage.getItem('elimaraCart')||'[]');

function money(n){return 'KES '+n.toLocaleString();}
function save(){localStorage.setItem('elimaraCart',JSON.stringify(cart));renderCart();}
function openEl(id){document.getElementById(id).classList.add('open');}
function closeEl(id){document.getElementById(id).classList.remove('open');}

document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeEl(b.dataset.close)));
document.getElementById('openCart').onclick=()=>document.getElementById('cartDrawer').classList.add('open');

document.querySelectorAll('.add-to-cart').forEach(btn=>btn.onclick=()=>{
  const p=products[btn.dataset.id];
  if(!cart.find(x=>x.id===p.id)) cart.push({id:p.id,qty:1});
  save(); document.getElementById('cartDrawer').classList.add('open');
});

document.querySelectorAll('.quick-view').forEach(btn=>btn.onclick=()=>{
  const p=products[btn.dataset.id];
  const next=p.sold+1;
  document.getElementById('detailContent').innerHTML=`
    <div class="detail-grid">
      <img src="${p.image}" alt="${p.title}">
      <div>
        <div class="eyebrow">LIMITED EDITION</div>
        <h2>${p.title}</h2>
        <p>Signed and numbered collector edition with a matching rear artwork label and Certificate of Authenticity.</p>
        <div class="specs">
          <div><span>Price</span><strong>${money(p.price)}</strong></div>
          <div><span>Edition</span><strong>${next.toString().padStart(2,'0')}/${p.editionSize}</strong></div>
          <div><span>Medium</span><strong>${p.medium}</strong></div>
          <div><span>Dimensions</span><strong>${p.dimensions}</strong></div>
          <div><span>Year</span><strong>${p.year}</strong></div>
          <div><span>Certificate</span><strong>${p.code}-${next.toString().padStart(3,'0')}</strong></div>
        </div>
        <button class="btn primary" onclick="addFromModal('${p.id}')">Buy this edition</button>
      </div>
    </div>`;
  openEl('detailModal');
});

window.addFromModal=(id)=>{
  if(!cart.find(x=>x.id===id)) cart.push({id,qty:1});
  save(); closeEl('detailModal'); document.getElementById('cartDrawer').classList.add('open');
};

function renderCart(){
  const el=document.getElementById('cartItems');
  document.getElementById('cartCount').textContent=cart.length;
  if(!cart.length){el.innerHTML='<p class="micro">No artwork selected yet.</p>'; document.getElementById('cartTotal').textContent='KES 0'; return;}
  el.innerHTML=cart.map(item=>{
    const p=products[item.id];
    return `<div class="cart-item">
      <img src="${p.image}" alt="${p.title}">
      <div><strong>${p.title}</strong><br><small>Next available edition ${String(p.sold+1).padStart(2,'0')}/${p.editionSize}</small></div>
      <button class="close" style="position:static;font-size:18px" onclick="removeItem('${p.id}')">×</button>
    </div>`;
  }).join('');
  const total=cart.reduce((s,i)=>s+products[i.id].price,0);
  document.getElementById('cartTotal').textContent=money(total);
}
window.removeItem=(id)=>{cart=cart.filter(x=>x.id!==id);save();};

document.getElementById('checkoutBtn').onclick=()=>{
  if(!cart.length) return;
  document.getElementById('cartDrawer').classList.remove('open');
  openEl('checkoutModal');
};

document.getElementById('checkoutForm').addEventListener('submit',(e)=>{
  e.preventDefault();
  if(!cart.length) return;
  const editions=cart.map(i=>{
    const p=products[i.id], no=p.sold+1;
    return `${p.title} — ${String(no).padStart(2,'0')}/${p.editionSize} (${p.code}-${String(no).padStart(3,'0')})`;
  }).join('; ');
  const data=new FormData(e.target);
  document.getElementById('successText').textContent =
    `Thank you, ${data.get('name')}. We have recorded your order request for ${editions}. This demo does not charge you. Elimara Studio can contact you to complete payment and delivery once live payment credentials are connected.`;
  cart=[];save();closeEl('checkoutModal');openEl('successModal');e.target.reset();
});
renderCart();
