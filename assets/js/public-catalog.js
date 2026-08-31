(() => {
  const cfg = window.ELIMARA_SUPABASE_CONFIG || {};
  if (!cfg.url || !cfg.anonKey || !window.supabase) return;

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  const money = n => `KES ${Number(n || 0).toLocaleString()}`;

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, ch => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[ch]));
  }

  function href(work) {
    return `artwork.html?slug=${encodeURIComponent(work.slug)}`;
  }

  function card(work) {
    const badge = work.availability === "Sold Out"
      ? "Sold out"
      : `Edition of ${work.edition_size || "—"} · ${work.availability || "Available"}`;

    return `
      <article class="work-card fade-up dynamic-work">
        <a href="${href(work)}" class="work-image">
          <div class="work-badge">${esc(badge)}</div>
          <img loading="lazy" src="${esc(work.main_image_url)}" alt="${esc(work.title)}">
        </a>
        <div class="work-meta">
          <div class="work-meta-top">
            <h3>${esc(work.title)}</h3>
            <span class="price">${money(work.price)}</span>
          </div>
          <p>${esc(work.medium || "Computational artwork")}${work.dimensions ? ` · ${esc(work.dimensions)}` : ""} · Signed & numbered</p>
          <div class="card-actions">
            <a class="btn primary" href="${href(work)}">View artwork</a>
            ${work.availability === "Sold Out"
              ? `<span class="btn" aria-disabled="true">Sold out</span>`
              : `<button class="btn" onclick='reserveArtwork(${JSON.stringify(work.title)},${Number(work.price || 0)})'>Reserve edition</button>`}
          </div>
        </div>
      </article>`;
  }

  function collectionSection(collection, works) {
    const section = document.createElement("section");
    section.className = "section rule dynamic-collection";
    section.id = `collection-${collection.slug || "studio"}`;
    section.innerHTML = `
      <div class="container">
        <div class="section-head fade-up in">
          <div>
            <div class="eyebrow">${esc(collection.name).toUpperCase()} · COLLECTION</div>
            <h2 class="section-title">${esc(collection.name)}</h2>
          </div>
          <p>${esc(collection.description || "A distinct body of computational work from Elimara Studio.")}</p>
        </div>
        <div class="works-grid">${works.map(card).join("")}</div>
      </div>`;
    return section;
  }

  async function loadContent() {
    const { data } = await sb.from("site_content").select("key,value");
    (data || []).forEach(item => {
      document.querySelectorAll(`[data-content-key="${CSS.escape(item.key)}"]`).forEach(el => {
        el.textContent = item.value || "";
      });
    });
  }

  async function loadWorks() {
    const { data, error } = await sb
      .from("artworks")
      .select("*, collections(name,slug,description,sort_order)")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error || !data?.length) return;

    const home = document.querySelector("#works");
    if (home) {
      // Keep the two original Nebula cards as a resilient static fallback.
      const dynamic = data.filter(w => !["ELA-NB01","ELA-NB02"].includes(w.code) && w.show_homepage);
      const groups = new Map();

      dynamic.forEach(work => {
        const c = work.collections || {name:"Studio Works",slug:"studio-works",description:""};
        const k = c.slug || c.name;
        if (!groups.has(k)) groups.set(k, {collection:c, works:[]});
        groups.get(k).works.push(work);
      });

      let insertionPoint = home;
      groups.forEach(({collection,works}) => {
        if ((collection.slug || "").toLowerCase() === "nebula") {
          home.querySelector(".works-grid")?.insertAdjacentHTML("beforeend", works.map(card).join(""));
        } else {
          const sec = collectionSection(collection, works);
          insertionPoint.insertAdjacentElement("afterend", sec);
          insertionPoint = sec;
        }
      });
    }

    const select = document.querySelector("#artSelect");
    if (select) {
      const existing = new Set([...select.options].map(o => o.textContent.trim()));
      data.filter(w => w.allow_wall_preview && w.main_image_url).forEach(work => {
        if (existing.has(work.title)) return;
        const option = document.createElement("option");
        option.value = work.main_image_url;
        option.textContent = work.title;
        select.appendChild(option);
      });
    }
  }

  Promise.all([loadContent(), loadWorks()]).catch(console.error);
})();