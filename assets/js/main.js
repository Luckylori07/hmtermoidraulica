/* HM Termoidraulica - script condiviso.
   Nessuna dipendenza. Animazioni: solo CSS, Web Animations API e IntersectionObserver.
   Tutto ridotto/disattivato con prefers-reduced-motion. */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const reduce = () => reduceQuery.matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const TZ = "Europe/Rome";   // le offerte sono HTML statico generato da tools/build.py (data/offerte.json)

  /* ---------- punto di controllo DEMO ----------
     Se l'attributo data-demo viene tolto dal <body>, banner e filigrana spariscono (CSS)
     e qui si rimuovono anche noindex e prefisso [DEMO] dal titolo. */
  if (!document.body.hasAttribute("data-demo")) {
    const robots = $('meta[name="robots"]');
    if (robots && /noindex/i.test(robots.content)) robots.remove();
    document.title = document.title.replace(/^\[DEMO\]\s*/, "");
  }

  /* ---------- altezza dell'header sticky (per gli scroll-margin) ---------- */
  const top = $(".site-top");
  if (top) {
    const setTop = () => document.documentElement.style.setProperty("--top-h", top.offsetHeight + "px");
    setTop();
    if ("ResizeObserver" in window) new ResizeObserver(setTop).observe(top);
    else addEventListener("resize", setTop);
  }

  /* ---------- header che cambia stile allo scroll ---------- */
  const header = $(".site-header");
  if (header && "IntersectionObserver" in window) {
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none";
    document.body.prepend(sentinel);
    new IntersectionObserver(([e]) => header.classList.toggle("is-scrolled", !e.isIntersecting)).observe(sentinel);
  }

  /* ---------- menu mobile ---------- */
  const menuBtn = $(".menu-btn");
  const mobileNav = $("#mobile-nav");
  if (menuBtn && mobileNav) {
    const setOpen = (open) => {
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
      mobileNav.hidden = !open;
    };
    menuBtn.addEventListener("click", () => setOpen(menuBtn.getAttribute("aria-expanded") !== "true"));
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !mobileNav.hidden) { setOpen(false); menuBtn.focus(); }
    });
    mobileNav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  }

  /* ---------- titoli: rivelazione per parola ---------- */
  $$("[data-split]").forEach((el) => {
    const walk = (node, counter) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            const inner = document.createElement("span");
            inner.style.setProperty("--wi", counter.i++);
            inner.textContent = part;
            w.append(inner);
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n, counter);
      });
    };
    walk(el, { i: 0 });
  });

  /* ---------- reveal allo scroll ---------- */
  const revealTargets = $$(".rv, [data-split], [data-steps], [data-scene]");
  if ("IntersectionObserver" in window && !reduce()) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((t) => io.observe(t));
  } else {
    revealTargets.forEach((t) => t.classList.add("is-in"));
  }

  /* ---------- contatori animati ---------- */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduce()) {
    counters.forEach((c) => { c.textContent = "0"; });
    const cio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target;
      const to = Number(el.dataset.count);
      const dur = 1300;
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }), { threshold: 0.6 });
    counters.forEach((c) => cio.observe(c));
  }

  /* ---------- mese corrente a Roma (serve per la stagione di partenza) ---------- */
  const romeMonth = () => Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(new Date()));

  /* ---------- hero: tubo che si disegna + goccia che scorre ---------- */
  const scene = $("[data-scene]");
  const pipe = $("#heroPipe");
  const drop = $("#heroDrop");
  if (scene && pipe && drop && pipe.getTotalLength && !reduce()) {
    const len = pipe.getTotalLength();
    const N = 90;
    const frames = [];
    for (let i = 0; i <= N; i++) {
      const p = pipe.getPointAtLength((len * i) / N);
      frames.push({ offset: (i / N) * 0.82, transform: `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`, opacity: i === 0 ? 0 : 1 });
    }
    frames[1].opacity = 1;
    const last = frames[frames.length - 1];
    frames.push({ offset: 0.88, transform: last.transform, opacity: 0 });
    frames.push({ offset: 1, transform: frames[0].transform, opacity: 0 });
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      drop.animate(frames, { duration: 5200, iterations: Infinity, delay: 2800, easing: "linear", fill: "both" });
    };
    if (scene.classList.contains("is-in")) start();
    else new MutationObserver((_, mo) => { if (scene.classList.contains("is-in")) { start(); mo.disconnect(); } })
      .observe(scene, { attributes: true, attributeFilter: ["class"] });
  }

  /* ---------- interruttore caldo / freddo ---------- */
  const season = $("[data-season]");
  if (season) {
    const tabs = $$('[role="tab"]', season);
    const panes = { hot: $("#pane-hot", season), cold: $("#pane-cold", season) };
    const setMode = (mode, focus) => {
      season.dataset.mode = mode;
      tabs.forEach((t) => {
        const on = t.id === "tab-" + mode;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      Object.entries(panes).forEach(([k, p]) => {
        const on = k === mode;
        p.classList.toggle("is-active", on);
        p.toggleAttribute("inert", !on);
        p.setAttribute("aria-hidden", String(!on));
      });
    };
    tabs.forEach((t) => {
      t.addEventListener("click", () => setMode(t.id.replace("tab-", "")));
      t.addEventListener("keydown", (e) => {
        if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          setMode(e.key === "ArrowLeft" || e.key === "Home" ? "hot" : "cold", true);
        }
      });
    });
    // stagione di partenza in base al mese: aprile-settembre freddo, altrimenti caldo
    const m = romeMonth();
    season.classList.add("is-init");
    setMode(m >= 4 && m <= 9 ? "cold" : "hot");
    requestAnimationFrame(() => requestAnimationFrame(() => season.classList.remove("is-init")));
  }

  /* ---------- indice servizi: voce attiva mentre si scorre ---------- */
  const idx = $$(".svc-index a");
  if (idx.length && "IntersectionObserver" in window) {
    const byId = new Map(idx.map((a) => [a.getAttribute("href").slice(1), a]));
    const sio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      idx.forEach((a) => a.classList.remove("is-active"));
      const a = byId.get(e.target.id);
      if (a) {
        a.classList.add("is-active");
        const box = a.parentElement.parentElement;
        if (box.scrollWidth > box.clientWidth) box.scrollTo({ left: a.offsetLeft - 16, behavior: reduce() ? "auto" : "smooth" });
      }
    }), { rootMargin: "-30% 0px -60% 0px" });
    $$(".sd").forEach((s) => sio.observe(s));
  }

  /* ---------- tilt delle offerte + pulsanti magnetici ---------- */
  function initInteractions(root) {
    if (!finePointer) return;
    $$("[data-tilt]", root).forEach((card) => {
      let raf = 0;
      card.addEventListener("pointermove", (e) => {
        if (reduce()) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          card.style.setProperty("--ry", ((x - 0.5) * 6).toFixed(2) + "deg");
          card.style.setProperty("--rx", ((0.5 - y) * 5).toFixed(2) + "deg");
          card.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
          card.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
        });
      });
      card.addEventListener("pointerleave", () => {
        cancelAnimationFrame(raf);
        ["--rx", "--ry"].forEach((p) => card.style.removeProperty(p));
      });
    });
    $$("[data-magnetic]", root).forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        if (reduce()) return;
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.setProperty("--mx", Math.max(-7, Math.min(7, dx * 0.12)).toFixed(1) + "px");
        btn.style.setProperty("--my", Math.max(-5, Math.min(5, dy * 0.2)).toFixed(1) + "px");
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.removeProperty("--mx");
        btn.style.removeProperty("--my");
      });
    });
  }
  initInteractions(document);
})();
