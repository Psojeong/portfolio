(function () {
  const SITE = window.SITE;
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Header ---------- */
  function renderHeader() {
    $("#header").innerHTML = `
      <header class="site-header">
        <nav class="nav">
          <a href="index.html" class="active">Work</a>
          <a href="${esc(SITE.artstation)}" target="_blank" rel="noopener">Artstation</a>
        </nav>
        <a class="logo" href="index.html">${esc(SITE.name)}</a>
      </header>`;
  }

  /* ---------- Covers ---------- */
  function coverHTML(p) {
    const img = p.thumb ? `<img src="${esc(p.thumb)}" alt="${esc(p.title)}" loading="lazy" decoding="async">` : "";
    const sub = p.description ? `<span class="details-sub">${esc(p.description)}</span>` : "";
    return `<a class="cover${p.thumb ? "" : " no-image"}" href="project.html?p=${encodeURIComponent(p.slug)}">
      ${img}
      <div class="details"><div class="details-title">${esc(p.title)}${sub}</div></div>
    </a>`;
  }

  function renderHome() {
    $("#main").innerHTML = `<section class="covers">${SITE.projects.map(coverHTML).join("")}</section>`;
  }

  /* ---------- Project modules ---------- */
  let gallery = [];

  function imgTag(src, w, h, cls = "") {
    const i = gallery.push(src) - 1;
    return `<img src="${esc(src)}" ${w ? `width="${w}" height="${h}"` : ""} loading="lazy" decoding="async" data-lb="${i}" class="${cls}" alt="">`;
  }

  function moduleHTML(m) {
    switch (m.t) {
      case "img": {
        // 원본이 작은 이미지는 원래 크기 이상으로 늘리지 않음
        const max = m.w && m.w < 1200 ? `max-width:${m.w}px;` : "";
        return `<div class="m-img"><div style="margin:0 auto;${max}">${imgTag(m.src, m.w, m.h)}</div></div>`;
      }
      case "text":
        return `<div class="m-text">${m.html}</div>`;
      case "video":
        return `<div class="m-video"><video src="${esc(m.src)}#t=0.5" controls playsinline preload="metadata"></video></div>`;
      case "grid": {
        const items = m.items.map((it) => {
          const ar = it.w && it.h ? it.w / it.h : 1;
          return `<div class="g-item" style="flex-grow:${ar.toFixed(4)};aspect-ratio:${it.w}/${it.h}">${imgTag(it.src, it.w, it.h)}</div>`;
        });
        return `<div class="m-grid">${items.join("")}</div>`;
      }
      case "row":
        return `<div class="m-row">${m.cols
          .map((c) => `<div class="col" style="flex:${c.flex} 1 0">${c.mods.map(moduleHTML).join("")}</div>`)
          .join("")}</div>`;
      default:
        return "";
    }
  }

  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  function renderProject(slug) {
    const p = SITE.projects.find((x) => x.slug === slug);
    if (!p) {
      location.replace("index.html");
      return;
    }
    document.title = `${p.title} — ${SITE.name}`;
    gallery = [];
    const body = p.modules.length
      ? p.modules.map(moduleHTML).join("")
      : `<p class="empty-note">준비 중입니다.</p>`;
    const others = shuffle(SITE.projects.filter((x) => x.slug !== slug && x.thumb)).slice(0, 10);
    $("#main").innerHTML = `
      <section class="page">
        <header class="page-header">
          <h1 class="page-title">${esc(p.title)}</h1>
          ${p.description ? `<p class="page-description">${esc(p.description)}</p>` : ""}
        </header>
        <div class="modules">${body}</div>
      </section>
      <section class="other-projects">
        <h3>You may also like</h3>
        <div class="covers">${others.map(coverHTML).join("")}</div>
      </section>
      <a class="back-to-top" href="#top">↑ Back to top</a>`;
    setupLightbox();
  }

  /* ---------- Lightbox ---------- */
  function setupLightbox() {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `<button class="lb-close" aria-label="닫기">×</button>
      <button class="lb-prev" aria-label="이전">‹</button>
      <img alt="">
      <button class="lb-next" aria-label="다음">›</button>
      <div class="lb-count"></div>`;
    document.body.appendChild(lb);
    const img = $("img", lb);
    let idx = 0;
    const show = (i) => {
      idx = (i + gallery.length) % gallery.length;
      img.src = gallery[idx];
      $(".lb-count", lb).textContent = `${idx + 1} / ${gallery.length}`;
    };
    const open = (i) => { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; };
    const close = () => { lb.classList.remove("open"); document.body.style.overflow = ""; img.removeAttribute("src"); };

    $("#main").addEventListener("click", (e) => {
      const t = e.target.closest("[data-lb]");
      if (t) open(+t.dataset.lb);
    });
    $(".lb-close", lb).onclick = close;
    $(".lb-prev", lb).onclick = (e) => { e.stopPropagation(); show(idx - 1); };
    $(".lb-next", lb).onclick = (e) => { e.stopPropagation(); show(idx + 1); };
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Boot ---------- */
  renderHeader();
  const slug = new URLSearchParams(location.search).get("p");
  if (document.body.dataset.page === "project") renderProject(slug);
  else renderHome();
})();
