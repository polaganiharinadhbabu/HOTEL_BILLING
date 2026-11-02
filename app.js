const $=s=>document.getElementById(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100, fmt=n=>'₹'+r2(n);
const K='tiffin-hotel-v1';
const mk=(id,name,...o)=>({id,name,on:1,opts:o.map(([l,p])=>({l,p}))});
let S={name:'My Tiffin Hotel',gst:5,next:1,orders:[],items:[
mk(1,'Idli (2 pcs)',['Single',30]),mk(2,'Plain Dosa',['Single',40]),mk(3,'Masala Dosa',['Single',60]),mk(4,'Medu Vada (2 pcs)',['Single',35]),
mk(5,'Pongal',['Half',30],['Full',45]),mk(6,'Poori',['Half',30],['Full',50]),mk(7,'Upma',['Half',25],['Full',35]),mk(8,'Tea',['Single',15]),mk(9,'Coffee',['Single',20])]};
try{const r=localStorage.getItem(K);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
S.items.forEach(i=>{if(!i.opts)i.opts=[{l:'Single',p:i.price||0}]});
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}};
const ld=iso=>new Date(iso).toLocaleDateString('en-CA');
let tab='order',cart={},type='dine',table='',cust='',pay='Cash',day=ld(new Date()),openItem=null;
const item=id=>S.items.find(x=>x.id==id);
const drop=id=>{for(const k of Object.keys(cart))if(k.split('|')[0]==id)delete cart[k]};
const qtyOf=id=>Object.keys(cart).filter(k=>k.split('|')[0]==id).reduce((a,k)=>a+cart[k],0);
const lineName=(i,o)=>i.opts.length>1?i.name+' ('+o.l+')':i.name;

function totals(){let sub=0;for(const k in cart){const[id,x]=k.split('|');const i=item(id);if(i&&i.opts[x])sub+=i.opts[x].p*cart[k]}const gst=r2(sub*S.gst/100);return{sub:r2(sub),gst,total:r2(sub+gst)}}
function msg(t){const m=$('msg');if(m)m.textContent=t}

function vOrder(){
const its=S.items.map(i=>{const q=qtyOf(i.id),mn=Math.min(...i.opts.map(o=>o.p)),m=i.opts.length>1;
return i.on?`<button class="item${q?' sel':''}" data-a="pick" data-id="${i.id}"><span>${esc(i.name)}</span><b>${m?'from ':''}${fmt(mn)}</b>${m?'<small>'+i.opts.map(o=>esc(o.l)).join(' · ')+'</small>':''}${q?`<em>${q}</em>`:''}</button>`:`<div class="item off"><span>${esc(i.name)}</span><b>Sold out</b></div>`}).join('');
const oi=openItem&&item(openItem);
const chooser=oi&&oi.on?`<div class="card pick"><b style="width:100%">${esc(oi.name)}: choose size</b>${oi.opts.map((o,x)=>`<button class="btn sm" data-a="opt" data-id="${oi.id}" data-i="${x}">${esc(o.l)} · ${fmt(o.p)}</button>`).join('')}<button class="btn sm alt" data-a="shut">Cancel</button></div>`:'';
const ks=Object.keys(cart).filter(k=>cart[k]>0),t=totals();
const lines=ks.map(k=>{const[id,x]=k.split('|'),i=item(id),o=i.opts[x];return `<div class="line"><span>${esc(lineName(i,o))}<br><small>${fmt(o.p)} each</small></span><button class="q" data-a="minus" data-k="${k}" aria-label="Less">−</button><b>${cart[k]}</b><button class="q" data-a="plus" data-k="${k}" aria-label="More">+</button><b style="min-width:64px;text-align:right">${fmt(o.p*cart[k])}</b></div>`}).join('')||'<p style="color:var(--mu)">Tap items above to add them.</p>';
return `<div class="seg" role="group" aria-label="Order type"><button data-a="type" data-v="dine" aria-pressed="${type==='dine'}">Dining</button><button data-a="type" data-v="take" aria-pressed="${type==='take'}">Takeaway</button></div>
${chooser}<div class="grid" style="margin:12px 0 16px">${its}</div>
<div class="card"><h3>Current order</h3>${lines}
${type==='dine'?`<label class="f" for="tb">Table number</label><input id="tb" data-f="table" value="${esc(table)}" inputmode="numeric" placeholder="e.g. 4">`:`<label class="f" for="cu">Customer name or phone (optional)</label><input id="cu" data-f="cust" value="${esc(cust)}" placeholder="e.g. Ravi">`}
<label class="f">Payment</label><div class="seg">${['Cash','UPI','Card'].map(p=>`<button data-a="pay" data-v="${p}" aria-pressed="${pay===p}">${p}</button>`).join('')}</div>
<div style="margin-top:10px"><div class="tot"><span>Subtotal</span><span>${fmt(t.sub)}</span></div><div class="tot"><span>GST ${S.gst}%</span><span>${fmt(t.gst)}</span></div><div class="tot big"><span>Total</span><span>${fmt(t.total)}</span></div></div>
<div class="msg" id="msg" role="status"></div>
<button class="btn" data-a="place">Place order and make bill</button>
${ks.length?'<button class="btn alt" data-a="clear" style="margin-top:8px">Clear order</button>':''}</div>`}

function vMenu(){
const cards=S.items.map(i=>`<div class="card"><div class="mh"><strong>${esc(i.name)}</strong><button class="btn sm alt" data-a="tog" data-id="${i.id}">${i.on?'Available':'Sold out'}</button><button class="btn sm alt" data-a="del" data-id="${i.id}">Remove</button></div>
${i.opts.map((o,x)=>`<div class="orow"><input value="${esc(o.l)}" data-a="label" data-id="${i.id}" data-i="${x}" aria-label="Size name" list="sizes"><input type="number" min="0" value="${o.p}" data-a="price" data-id="${i.id}" data-i="${x}" aria-label="Price"><button class="q" data-a="delopt" data-id="${i.id}" data-i="${x}" aria-label="Remove size" ${i.opts.length<2?'disabled':''}>×</button></div>`).join('')}
<button class="btn sm alt" data-a="addopt" data-id="${i.id}" style="margin-top:10px">+ Add size</button></div>`).join('');
return `<datalist id="sizes"><option value="Single"><option value="Half"><option value="Full"><option value="Quarter"></datalist>
<div class="card"><h3>Hotel details</h3><label class="f" for="hnm">Hotel name</label><input id="hnm" data-f="name" value="${esc(S.name)}"><label class="f" for="gs">GST % on bills (use 0 for none)</label><input id="gs" type="number" min="0" max="28" data-f="gst" value="${S.gst}"></div>
<div class="card"><h3>Add a menu item</h3><label class="f" for="nn">Item name</label><input id="nn" placeholder="e.g. Rava Dosa">
<label class="f">Prices (₹). Fill only the sizes you sell</label><div class="row3"><div><small>Single plate</small><input id="p1" type="number" min="1" inputmode="decimal"></div><div><small>Half</small><input id="p2" type="number" min="1" inputmode="decimal"></div><div><small>Full</small><input id="p3" type="number" min="1" inputmode="decimal"></div></div>
<div class="msg" id="msg" role="status"></div><button class="btn" data-a="additem" style="margin-top:4px">Add item</button></div>
<h3 style="margin:6px 0 10px">Menu items</h3>${cards||'<p>No items yet.</p>'}`}

function vBills(){
const os=S.orders.filter(o=>ld(o.time)===day).reverse();
const sum=f=>r2(os.filter(f).reduce((a,o)=>a+o.total,0));
return `<label class="f" for="dy">Date</label><input id="dy" type="date" data-f="day" value="${day}" style="max-width:200px;margin-bottom:12px">
<div class="stats"><div class="stat"><small>Orders</small><b>${os.length}</b></div><div class="stat"><small>Total sales</small><b>${fmt(sum(()=>1))}</b></div><div class="stat"><small>Dining</small><b>${fmt(sum(o=>o.type==='dine'))}</b></div><div class="stat"><small>Takeaway</small><b>${fmt(sum(o=>o.type==='take'))}</b></div></div>
${os.map(o=>`<button class="ord" data-a="bill" data-no="${o.no}"><span><b>#${o.no}</b> · ${o.type==='dine'?'Dining, table '+esc(o.table):'Takeaway'} · ${new Date(o.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span><b>${fmt(o.total)}</b></button>`).join('')||'<p style="color:var(--mu)">No bills on this date.</p>'}`}

function render(){document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===tab));$('hn').textContent=S.name;$('main').innerHTML=tab==='order'?vOrder():tab==='menu'?vMenu():vBills()}

function showBill(o){
$('bill').innerHTML=`<h2>${esc(S.name)}</h2><div class="c">Bill #${o.no}<br>${new Date(o.time).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})}<br>${o.type==='dine'?'Dining · Table '+esc(o.table):'Takeaway'+(o.cust?' · '+esc(o.cust):'')}</div>
<table>${o.lines.map(l=>`<tr><td>${esc(l.name)} × ${l.qty}</td><td>${fmt(l.price*l.qty)}</td></tr>`).join('')}</table>
<div class="t"><span>Subtotal</span><span>${fmt(o.sub)}</span></div><div class="t" style="border:0"><span>GST ${o.gstp}%</span><span>${fmt(o.gst)}</span></div><div class="t"><b>Total</b><b>${fmt(o.total)}</b></div><div class="c" style="margin-top:8px">Paid by ${o.pay}<br>Thank you! Visit again.</div>
<div class="acts"><button class="btn sm" data-a="print">Print</button><button class="btn sm alt" data-a="close" style="color:#222">Close</button></div>`;$('ov').classList.add('on')}

function place(){
const ks=Object.keys(cart).filter(k=>cart[k]>0);
if(!ks.length)return msg('Add at least one item.');
if(type==='dine'&&!table.trim())return msg('Enter the table number.');
const t=totals();
const o={no:S.next++,time:new Date().toISOString(),type,table:table.trim(),cust:cust.trim(),lines:ks.map(k=>{const[id,x]=k.split('|'),i=item(id);return{name:lineName(i,i.opts[x]),price:i.opts[x].p,qty:cart[k]}}),sub:t.sub,gstp:S.gst,gst:t.gst,total:t.total,pay};
S.orders.push(o);save();cart={};table='';cust='';openItem=null;render();showBill(o)}

document.addEventListener('click',e=>{
const nb=e.target.closest('nav button');if(nb){tab=nb.dataset.t;openItem=null;render();return}
const b=e.target.closest('[data-a]');if(!b||b.tagName==='INPUT')return;const a=b.dataset.a,id=b.dataset.id,k=b.dataset.k;
if(a==='pick'){const i=item(id);if(i.opts.length===1){cart[id+'|0']=(cart[id+'|0']||0)+1;openItem=null}else openItem=id;render()}
else if(a==='opt'){const q=id+'|'+b.dataset.i;cart[q]=(cart[q]||0)+1;openItem=null;render()}
else if(a==='shut'){openItem=null;render()}
else if(a==='plus'){cart[k]++;render()}
else if(a==='minus'){cart[k]--;if(cart[k]<1)delete cart[k];render()}
else if(a==='type'){type=b.dataset.v;render()}
else if(a==='pay'){pay=b.dataset.v;render()}
else if(a==='clear'){cart={};render()}
else if(a==='place')place();
else if(a==='tog'){const i=item(id);i.on=i.on?0:1;if(!i.on)drop(id);save();render()}
else if(a==='del'){if(b.dataset.armed){S.items=S.items.filter(x=>x.id!=id);drop(id);save();render()}else{b.dataset.armed=1;b.textContent='Tap again to remove';setTimeout(()=>{delete b.dataset.armed;b.textContent='Remove'},3000)}}
else if(a==='addopt'){item(id).opts.push({l:'Full',p:0});drop(id);save();render()}
else if(a==='delopt'){const i=item(id);if(i.opts.length>1){i.opts.splice(+b.dataset.i,1);drop(id);save();render()}}
else if(a==='additem'){const n=$('nn').value.trim(),o=[['Single','p1'],['Half','p2'],['Full','p3']].map(([l,f])=>({l,p:parseFloat($(f).value)})).filter(x=>x.p>0).map(x=>({l:x.l,p:r2(x.p)}));
if(!n||!o.length)return msg('Enter a name and at least one price above 0.');
S.items.push({id:Date.now(),name:n,on:1,opts:o});save();render();msg('Added '+n+'.')}
else if(a==='bill'){showBill(S.orders.find(o=>o.no==b.dataset.no))}
else if(a==='print'){try{window.print()}catch(x){}}
else if(a==='close')$('ov').classList.remove('on')});
document.addEventListener('input',e=>{const f=e.target.dataset.f;if(!f)return;const v=e.target.value;
if(f==='table')table=v;else if(f==='cust')cust=v;else if(f==='name'){S.name=v||'Tiffin Hotel';$('hn').textContent=S.name;save()}
else if(f==='gst'){S.gst=Math.min(28,Math.max(0,parseFloat(v)||0));save()}});
document.addEventListener('change',e=>{const t=e.target,a=t.dataset.a;
if(t.dataset.f==='day'&&t.value){day=t.value;render()}
if(a==='price'){const p=parseFloat(t.value),o=item(t.dataset.id).opts[t.dataset.i];if(p>=0){o.p=r2(p);save()}else t.value=o.p}
if(a==='label'){const o=item(t.dataset.id).opts[t.dataset.i];o.l=t.value.trim()||o.l;t.value=o.l;save()}});
render();
