(() => {
  const cfg = window.ELIMARA_SUPABASE_CONFIG || {};
  const setupGate = document.getElementById("setupGate");
  const loginView = document.getElementById("loginView");
  const adminApp = document.getElementById("adminApp");

  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    setupGate.classList.remove("hidden");
    return;
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  const bucket = cfg.bucket || "studio-media";
  let collections = [], artworks = [], content = [], activeArtwork = null;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const slugify = s => String(s || "").toLowerCase().trim().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
  const esc = v => String(v ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  function status(el,msg,type=""){ if(!el)return; el.textContent=msg; el.className=`status ${type}`; }

  async function showSession(session){
    if(session){ loginView.classList.add("hidden"); adminApp.classList.remove("hidden"); await loadAll(); }
    else { adminApp.classList.add("hidden"); loginView.classList.remove("hidden"); }
  }

  $("#loginForm").addEventListener("submit", async e => {
    e.preventDefault(); status($("#loginStatus"),"Signing in…");
    const {error} = await sb.auth.signInWithPassword({email:$("#loginEmail").value.trim(),password:$("#loginPassword").value});
    if(error) status($("#loginStatus"),error.message,"error");
  });
  $("#logoutBtn").addEventListener("click",()=>sb.auth.signOut());

  sb.auth.getSession().then(({data:{session}})=>showSession(session));
  sb.auth.onAuthStateChange((_e,s)=>showSession(s));

  $$(".nav-item").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
  $$("[data-view-jump]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.viewJump)));
  function switchView(name){
    $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
    $$(".view").forEach(v=>v.classList.remove("active"));
    $(`#${name}View`)?.classList.add("active");
    $("#viewTitle").textContent=({dashboard:"Overview",artworks:"Artworks",collections:"Collections",content:"Content"})[name]||name;
  }

  async function loadAll(){
    await Promise.all([loadCollections(),loadArtworks(),loadContent()]);
    stats(); renderRecent(); renderArtworks(); renderCollections(); populateCollections(); renderContent();
  }
  async function loadCollections(){ const {data,error}=await sb.from("collections").select("*").order("sort_order"); if(error)console.error(error); else collections=data||[]; }
  async function loadArtworks(){ const {data,error}=await sb.from("artworks").select("*, collections(name,slug)").order("sort_order").order("created_at",{ascending:false}); if(error)console.error(error); else artworks=data||[]; }
  async function loadContent(){ const {data,error}=await sb.from("site_content").select("*").order("sort_order"); if(error)console.error(error); else content=data||[]; }

  function stats(){ $("#statPublished").textContent=artworks.filter(a=>a.published).length; $("#statDrafts").textContent=artworks.filter(a=>!a.published).length; $("#statCollections").textContent=collections.length; $("#statSold").textContent=artworks.reduce((n,a)=>n+Number(a.editions_sold||0),0); }
  function thumb(a){ return a.main_image_url?`<img src="${esc(a.main_image_url)}" alt="">`:`<div style="width:70px;height:70px;background:#191919"></div>`; }

  function renderRecent(){ $("#recentWorks").innerHTML=artworks.slice(0,5).map(a=>`<div class="mini-row">${thumb(a)}<div><strong>${esc(a.title)}</strong><small>${esc(a.collections?.name||"No collection")} · ${esc(a.code||"")}</small></div><button class="text-button" data-edit="${a.id}">Edit</button></div>`).join("")||`<p>No artworks yet.</p>`; bindEdits(); }

  function renderArtworks(){
    const q=($("#artSearch").value||"").toLowerCase(), f=$("#artFilter").value;
    const list=artworks.filter(a=>{const hay=`${a.title} ${a.code} ${a.collections?.name||""}`.toLowerCase(); if(q&&!hay.includes(q))return false; if(f==="published"&&!a.published)return false;if(f==="draft"&&a.published)return false;if(f==="soldout"&&a.availability!=="Sold Out")return false;return true;});
    $("#artworkList").innerHTML=list.map(a=>`<div class="art-row">${a.main_image_url?`<img src="${esc(a.main_image_url)}" alt="">`:`<div></div>`}<div><h3>${esc(a.title)}</h3><p>${esc(a.collections?.name||"No collection")} · ${esc(a.code||"")}</p></div><div>KES ${Number(a.price||0).toLocaleString()}</div><div>${Number(a.editions_sold||0)}/${Number(a.edition_size||0)}</div><div><span class="badge ${a.published?"live":"draft"}">${a.published?"Published":"Draft"}</span></div><button class="button" data-edit="${a.id}">Edit</button></div>`).join("")||`<div class="panel">No matching artworks.</div>`; bindEdits();
  }
  $("#artSearch").addEventListener("input",renderArtworks); $("#artFilter").addEventListener("change",renderArtworks);

  function renderCollections(){ $("#collectionList").innerHTML=collections.map(c=>{const count=artworks.filter(a=>a.collection_id===c.id).length;return `<div class="mini-row"><div style="width:70px;height:70px;display:grid;place-items:center;border:1px solid var(--line);font-family:var(--serif);font-size:1.6rem">${count}</div><div><strong>${esc(c.name)}</strong><small>${esc(c.slug)} · ${c.published?"Published":"Draft"}</small></div><span>Order ${c.sort_order}</span></div>`}).join(""); }
  function populateCollections(){ const sel=$("#artworkForm select[name=collection_id]"); sel.innerHTML=collections.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join(""); }

  $("#collectionForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const name=fd.get("name").trim();const payload={name,slug:fd.get("slug").trim()||slugify(name),description:fd.get("description").trim(),sort_order:Number(fd.get("sort_order")||10),published:fd.get("published")==="on"};status($("#collectionStatus"),"Saving…");const {error}=await sb.from("collections").insert(payload);if(error)return status($("#collectionStatus"),error.message,"error");e.currentTarget.reset();status($("#collectionStatus"),"Collection created.","success");await loadAll();});

  function renderContent(){
    $("#contentEditor").innerHTML=content.map(c=>`<div class="content-card"><h3>${esc(c.label)}</h3><p>${esc(c.key)}</p><textarea rows="6" data-content-id="${c.id}">${esc(c.value||"")}</textarea></div>`).join("");
  }
  $("#saveContentBtn").addEventListener("click",async()=>{status($("#contentStatus"),"Saving…");try{for(const el of $$("[data-content-id]")){const {error}=await sb.from("site_content").update({value:el.value}).eq("id",el.dataset.contentId);if(error)throw error;}status($("#contentStatus"),"Public content saved.","success");await loadContent();}catch(err){status($("#contentStatus"),err.message,"error");}});

  function bindEdits(){ $$("[data-edit]").forEach(b=>b.onclick=()=>openArtwork(b.dataset.edit)); }
  $("#newArtworkBtn").addEventListener("click",()=>openArtwork());
  $("#closeDrawer").addEventListener("click",closeArtwork); $("#cancelArtworkBtn").addEventListener("click",closeArtwork);
  function closeArtwork(){ $("#artworkDrawer").classList.remove("open");activeArtwork=null; }

  function openArtwork(id=null){
    activeArtwork=id?artworks.find(a=>a.id===id):null;const form=$("#artworkForm");form.reset();populateCollections();$("#existingMockups").innerHTML="";$("#mainImagePreview").innerHTML="";$("#artworkStatus").textContent="";$("#deleteArtworkBtn").classList.toggle("hidden",!activeArtwork);$("#drawerTitle").textContent=activeArtwork?activeArtwork.title:"New artwork";
    if(activeArtwork){Object.entries(activeArtwork).forEach(([k,v])=>{const el=form.elements[k];if(!el||v==null)return;if(el.type==="checkbox")el.checked=Boolean(v);else if(el.type!=="file")el.value=v;});if(activeArtwork.main_image_url)$("#mainImagePreview").innerHTML=`<img src="${esc(activeArtwork.main_image_url)}" alt="">`;loadMockups(activeArtwork.id);}
    else{form.elements.year.value=new Date().getFullYear();form.elements.price.value=28000;form.elements.edition_size.value=25;form.elements.editions_sold.value=0;form.elements.medium.value="Archival pigment print on 100% cotton rag";form.elements.show_homepage.checked=true;form.elements.allow_wall_preview.checked=true;form.elements.published.checked=false;}
    $("#artworkDrawer").classList.add("open");
  }

  $("#artworkForm input[name=title]").addEventListener("input",e=>{if(!activeArtwork)$("#artworkForm input[name=slug]").value=slugify(e.target.value);});

  async function upload(file,folder){const ext=(file.name.split(".").pop()||"jpg").toLowerCase();const path=`${folder}/${crypto.randomUUID()}.${ext}`;const {error}=await sb.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false});if(error)throw error;const {data}=sb.storage.from(bucket).getPublicUrl(path);return {path,url:data.publicUrl};}

  async function loadMockups(id){const {data,error}=await sb.from("artwork_mockups").select("*").eq("artwork_id",id).order("sort_order");if(error)return console.error(error);$("#existingMockups").innerHTML=(data||[]).map(m=>`<div class="mockup-card"><img src="${esc(m.image_url)}" alt=""><button type="button" data-del-m="${m.id}" data-path="${esc(m.image_path||"")}">×</button><span>${esc(m.caption||"Room mockup")}</span></div>`).join("");$$("[data-del-m]").forEach(b=>b.onclick=async()=>{if(!confirm("Remove this mockup?"))return;if(b.dataset.path)await sb.storage.from(bucket).remove([b.dataset.path]);await sb.from("artwork_mockups").delete().eq("id",b.dataset.delM);loadMockups(id);});}

  $("#artworkForm").addEventListener("submit",async e=>{
    e.preventDefault();const form=e.currentTarget,fd=new FormData(form);status($("#artworkStatus"),"Saving artwork…");
    try{
      let main_image_url=activeArtwork?.main_image_url||"",main_image_path=activeArtwork?.main_image_path||"";
      const f=form.elements.main_image.files?.[0];if(f){const up=await upload(f,"artworks");main_image_url=up.url;main_image_path=up.path;}
      const payload={collection_id:fd.get("collection_id"),title:fd.get("title").trim(),short_title:fd.get("short_title").trim(),slug:fd.get("slug").trim()||slugify(fd.get("title")),year:Number(fd.get("year")),price:Number(fd.get("price")),edition_size:Number(fd.get("edition_size")),editions_sold:Number(fd.get("editions_sold")||0),code:fd.get("code").trim(),availability:fd.get("availability"),medium:fd.get("medium").trim(),dimensions:fd.get("dimensions").trim(),story:fd.get("story").trim(),seo_description:fd.get("seo_description").trim(),main_image_url,main_image_path,published:fd.get("published")==="on",show_homepage:fd.get("show_homepage")==="on",allow_wall_preview:fd.get("allow_wall_preview")==="on",sort_order:Number(fd.get("sort_order")||10)};
      let id=activeArtwork?.id;
      if(id){const {error}=await sb.from("artworks").update(payload).eq("id",id);if(error)throw error;}
      else{const {data,error}=await sb.from("artworks").insert(payload).select("id").single();if(error)throw error;id=data.id;}
      const files=[...(form.elements.mockups.files||[])],cap=fd.get("mockup_caption").trim();for(let i=0;i<files.length;i++){const up=await upload(files[i],`mockups/${id}`);const {error}=await sb.from("artwork_mockups").insert({artwork_id:id,image_url:up.url,image_path:up.path,caption:cap||`Room mockup ${i+1}`,sort_order:i+10});if(error)throw error;}
      status($("#artworkStatus"),"Artwork saved.","success");await loadAll();activeArtwork=artworks.find(a=>a.id===id);if(activeArtwork)await loadMockups(id);
    }catch(err){console.error(err);status($("#artworkStatus"),err.message||"Could not save artwork.","error");}
  });

  $("#deleteArtworkBtn").addEventListener("click",async()=>{if(!activeArtwork||!confirm(`Delete "${activeArtwork.title}"?`))return;const {error}=await sb.from("artworks").delete().eq("id",activeArtwork.id);if(error)return status($("#artworkStatus"),error.message,"error");closeArtwork();await loadAll();});
})();