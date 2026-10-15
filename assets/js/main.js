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
  const TZ = "Europe/Rome";

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

  /* ---------- Aperto ora / Chiuso (fuso Europe/Rome) ---------- */
  const OPEN_H = 8, CLOSE_H = 18;               // lun-ven 8:00-18:00
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const romeNow = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    return { day: WD[get("weekday")], h: Number(get("hour")), m: Number(get("minute")), month: Number(
      new Intl.DateTimeFormat("en-GB", { timeZone: TZ, month: "numeric" }).format(new Date())) };
  };
  const statusInfo = () => {
    const { day, h } = romeNow();
    const weekday = day >= 1 && day <= 5;
    if (weekday && h >= OPEN_H && h < CLOSE_H) return { state: "open", text: `Aperto ora, chiude alle ${CLOSE_H}:00`, day };
    let when;
    if (weekday && h < OPEN_H) when = `apre oggi alle ${OPEN_H}:00`;
    else if (day >= 1 && day <= 4) when = `riapre domani alle ${OPEN_H}:00`;
    else when = `riapre lunedì alle ${OPEN_H}:00`;
    return { state: "closed", text: `Chiuso ora, ${when}`, day };
  };
  const updateStatus = () => {
    const info = statusInfo();
    $$("[data-status]").forEach((el) => {
      el.dataset.state = info.state;
      const t = $("[data-status-text]", el);
      if (t) t.textContent = info.text;
    });
    $$("[data-hours] [data-day]").forEach((row) => row.classList.toggle("is-today", Number(row.dataset.day) === info.day));
  };
  if ($$("[data-status]").length) {
    updateStatus();
    setInterval(updateStatus, 60000);
  }

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
    const m = romeNow().month;
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

  /* ---------- offerte da data/offerte.json ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const euro = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
  const icon = (name) => `<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
  const offerCard = (o, c) => {
    const cold = o.tema === "freddo";
    const img = o.immagine;
    const body = encodeURIComponent(
      `Buongiorno,\n\nvorrei un preventivo gratuito per: ${o.titolo}.\n\nComune: \nTelefono per essere ricontattato: \n\nGrazie`
    );
    const subject = encodeURIComponent(`Richiesta preventivo - ${o.titolo}`);
    return `
      <article class="offer offer--${cold ? "cold" : "hot"} offer--${img.fit === "contain" ? "contain" : "cover"} has-ico rv" id="${esc(o.id)}" data-tilt>
        <figure class="offer__fig">
          <span class="offer__tag">${icon(cold ? "snow" : "flame")}${esc(o.etichetta)}</span>
          <div class="offer__float"><picture>
            <source type="image/webp" srcset="${esc(img.webp)}">
            <img src="${esc(img.jpg)}" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}" loading="lazy" decoding="async">
          </picture></div>
        </figure>
        <div class="offer__body">
          <h3>${esc(o.titolo)}</h3>
          <p class="offer__desc">${esc(o.descrizione)}</p>
          <p class="offer__price"><span class="offer__from">${esc(o.prezzo_etichetta)}</span><span class="offer__amount">${euro(o.prezzo_da)}</span>${o.condizione ? `<span class="offer__cond">${esc(o.condizione)}</span>` : ""}</p>
          <ul class="checklist">${o.include.map((i) => `<li>${icon("check")}<span>${esc(i)}</span></li>`).join("")}</ul>
          <div class="offer__cta">
            <a class="btn" data-magnetic href="mailto:${esc(c.email)}?subject=${subject}&amp;body=${body}">${icon("mail")}<span>Richiedi preventivo gratuito</span></a>
            <a class="btn btn--ghost" data-magnetic href="tel:${esc(c.telefono_tel)}">${icon("phone")}<span>Chiama ${esc(c.telefono)}</span></a>
          </div>
        </div>
      </article>`;
  };
  const offerBoxes = $$("[data-offers]");
  if (offerBoxes.length) {
    fetch("data/offerte.json", { cache: "no-cache" })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => {
        offerBoxes.forEach((box) => {
          box.innerHTML = data.offerte.map((o) => offerCard(o, data.contatto)).join("");
          $$(".rv", box).forEach((el, i) => { el.style.setProperty("--i", i); });
          initReveal($$(".rv", box));
          initInteractions(box);
        });
        $$("[data-note]").forEach((el) => { el.textContent = data.note[el.dataset.note] || ""; });
      })
      .catch(() => {
        offerBoxes.forEach((box) => {
          box.innerHTML = '<p class="offers-loading">Non riusciamo a caricare le offerte. <a href="tel:+393463562540">Chiamaci al +39 346 356 2540</a>.</p>';
        });
      });
  }

  function initReveal(els) {
    if ("IntersectionObserver" in window && !reduce()) {
      const io2 = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io2.unobserve(e.target); }
      }), { threshold: 0.12 });
      els.forEach((t) => io2.observe(t));
    } else els.forEach((t) => t.classList.add("is-in"));
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
