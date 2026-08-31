(() => {
  const root = document.getElementById("dynamicArtwork");
  const cfg = window.ELIMARA_SUPABASE_CONFIG || {};
  if (!root) return;

  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) {
    root.innerHTML = `<div class="container section"><h1 class="section-title">Artwork not found.</h1></div>`;
    return;
  }

  if (!cfg.url || !cfg.anonKey || !window.supabase) {
    root.innerHTML = `<div class="container section"><div class="eyebrow">STUDIO CATALOGUE</div><h1 class="section-title">Catalogue connection not configured.</h1><p class="lead">Add the Supabase project URL and anon key in assets/js/supabase-config.js.</p></div>`;
    return;
  }

  const sb = window.supabase.createClient(cfg.url, cfg.anonKey);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[ch]));

  async function load() {
    const { data: work, error } = await sb
      .from("artworks")
      .select("*, collections(name,slug,description)")
      .eq("slug", slug)
      .eq("published", true)
      .single();

    if (error || !work) {
      root.innerHTML = `<div class="container section"><div class="eyebrow">STUDIO CATALOGUE</div><h1 class="section-title">Artwork unavailable.</h1><p class="lead">This work may be unpublished or no longer available.</p><a class="btn primary" href="index.html#works">Return to available works</a></div>`;
      return;
    }

    const { data: mockups } = await sb
      .from("artwork_mockups")
      .select("*")
      .eq("artwork_id", work.id)
      .order("sort_order");

    const remaining = Math.max(0, Number(work.edition_size || 0) - Number(work.editions_sold || 0));
    document.title = `${work.title} — Elimara Studio`;

    root.innerHTML = `
      <section class="product-hero">
        <div class="product-media"><img src="${esc(work.main_image_url)}" alt="${esc(work.title)}"></div>
        <div class="product-info">
          <div class="eyebrow">${esc(work.collections?.name || "ELIMARA STUDIO")} · ${esc(work.year || "")}</div>
          <h1>${esc(work.title)}</h1>
          <p class="story">${esc(work.story || "")}</p>
          <div class="product-price">KES ${Number(work.price || 0).toLocaleString()}</div>
          <div class="spec-table">
            <div class="spec-row"><span>Edition</span><span>${esc(work.edition_size || "—")}</span></div>
            <div class="spec-row"><span>Availability</span><span>${esc(work.availability || "Available")}</span></div>
            <div class="spec-row"><span>Unallocated</span><span>${remaining}</span></div>
            <div class="spec-row"><span>Medium</span><span>${esc(work.medium || "—")}</span></div>
            <div class="spec-row"><span>Dimensions</span><span>${esc(work.dimensions || "—")}</span></div>
            <div class="spec-row"><span>Catalogue</span><span>${esc(work.code || "—")}</span></div>
          </div>
          ${work.availability === "Sold Out"
            ? `<span class="btn full">Edition closed</span>`
            : `<button class="btn primary full" onclick='reserveArtwork(${JSON.stringify(work.title)},${Number(work.price || 0)})'>Reserve an edition</button>`}
        </div>
      </section>

      <section class="section rule">
        <div class="container product-story-grid">
          <div><div class="eyebrow">THE WORK</div><div class="quote">${esc(work.short_title || work.title)}</div></div>
          <div><p>${esc(work.story || "")}</p>${work.seo_description ? `<p>${esc(work.seo_description)}</p>` : ""}</div>
        </div>
      </section>

      ${(mockups || []).length ? `
      <section class="section rule">
        <div class="container">
          <div class="section-head"><div><div class="eyebrow">IN SPACE</div><h2 class="section-title">See it in context.</h2></div><p>Room studies help communicate scale and atmosphere before acquisition.</p></div>
          <div class="works-grid">
            ${(mockups || []).map(m => `<div class="room-shot"><img src="${esc(m.image_url)}" alt="${esc(m.caption || work.title)}">${m.caption ? `<div class="room-caption">${esc(m.caption)}</div>` : ""}</div>`).join("")}
          </div>
        </div>
      </section>` : ""}
    `;
  }

  load().catch(console.error);
})();