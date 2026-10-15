#!/usr/bin/env python3
"""
Aggiorna le parti comuni di tutte le pagine (head, banner demo + header, footer)
e genera sitemap.xml e robots.txt.

Uso:
    python3 tools/build.py          # modalità DEMO (banner, filigrana, noindex)
    python3 tools/build.py --live   # sito definitivo: toglie banner, filigrana, noindex, prefisso [DEMO]

Il contenuto di ogni pagina (tra <main> e </main>) NON viene toccato: si modifica a mano.
Le parti comuni stanno tra i marcatori <!--build:xxx--> ... <!--/build:xxx-->.
"""
import json
import re
import sys
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIVE = "--live" in sys.argv

SITE = "https://hmtermoidraulica.it"
NAME = "HM Termoidraulica"
PHONE_DISPLAY = "+39 346 356 2540"
PHONE_TEL = "+393463562540"
WA = "https://wa.me/393463562540"
EMAIL = "hmtermoidraulica1@gmail.com"
PIVA = "03876450127"
TRAMONTIS = "https://tramontis.netlify.app/"

PAGES = {
    "index.html": {
        "title": "Termoidraulico a Gallarate e provincia di Varese",
        "desc": "HM Termoidraulica, termoidraulico a Gallarate (VA): caldaie, climatizzatori, pompe di calore, bagni e riparazioni in provincia di Varese. Preventivo gratuito: chiama +39 346 356 2540.",
        "nav": None,
        "jsonld": True,
    },
    "servizi.html": {
        "title": "Servizi: caldaie, clima, bagni e impianti a Varese",
        "desc": "Installazione caldaie, climatizzatori e pompe di calore, ristrutturazione bagni, riparazione impianti idraulici e sgorgo scarichi a Gallarate e in provincia di Varese.",
        "nav": "servizi.html",
    },
    "offerte.html": {
        "title": "Offerte installazione caldaie e climatizzatori",
        "desc": "Installazione caldaie Vaillant e Baxi, climatizzatori Hisense: offerte a partire da prezzo, sopralluogo e preventivo gratuito a Gallarate e provincia di Varese.",
        "nav": "offerte.html",
    },
    "contatti.html": {
        "title": "Contatti e orari: telefono, WhatsApp, email",
        "desc": "Contatta HM Termoidraulica a Gallarate (VA): telefono +39 346 356 2540, WhatsApp ed email. Aperti dal lunedì al venerdì, 8:00-18:00.",
        "nav": "contatti.html",
        "jsonld": True,
    },
    "privacy.html": {
        "title": "Informativa sulla privacy",
        "desc": "Informativa privacy di HM Termoidraulica: il sito non raccoglie dati personali e non usa cookie.",
        "nav": None,
    },
    "note-legali.html": {
        "title": "Note legali",
        "desc": "Note legali di HM Termoidraulica: dati dell'attività, sede a Gallarate (VA), partita IVA e contatti.",
        "nav": None,
    },
}

NAV = [("servizi.html", "Servizi"), ("offerte.html", "Offerte"), ("contatti.html", "Contatti")]


def icon(name, cls="ico", extra=""):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"{extra}><use href="#i-{name}"/></svg>'


def head(page, meta):
    title = f'{"" if LIVE else "[DEMO] "}{meta["title"]} | {NAME}'
    og_img = f"{SITE}/assets/img/og-cover.jpg"
    out = [
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        f"<title>{escape(title)}</title>",
        f'<meta name="description" content="{escape(meta["desc"], quote=True)}">',
    ]
    if not LIVE:
        out.append('<meta name="robots" content="noindex, nofollow">')
    out += [
        '<meta name="theme-color" content="#0b2545">',
        '<meta property="og:type" content="website">',
        '<meta property="og:locale" content="it_IT">',
        f'<meta property="og:site_name" content="{NAME}">',
        f'<meta property="og:title" content="{escape(title, quote=True)}">',
        f'<meta property="og:description" content="{escape(meta["desc"], quote=True)}">',
        f'<meta property="og:image" content="{og_img}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png">',
        '<link rel="icon" type="image/png" sizes="192x192" href="assets/img/favicon-192.png">',
        '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">',
        '<link rel="preload" href="assets/fonts/plus-jakarta-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="preload" href="assets/fonts/bricolage-grotesque-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>',
        '<link rel="stylesheet" href="assets/css/style.css">',
        "<script>document.documentElement.classList.remove('no-js')</script>",
    ]
    if meta.get("jsonld"):
        ld = {
            "@context": "https://schema.org",
            "@type": ["Plumber", "HVACBusiness"],
            "name": NAME,
            "url": SITE + "/",
            "logo": f"{SITE}/assets/img/logo-hm-termoidraulica.png",
            "image": og_img,
            "description": "Impianti termoidraulici, caldaie, climatizzatori, pompe di calore, bagni e riparazioni a Gallarate e in provincia di Varese.",
            "telephone": PHONE_DISPLAY,
            "email": EMAIL,
            "vatID": "IT" + PIVA,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": "Gallarate",
                "addressRegion": "VA",
                "postalCode": "21013",
                "addressCountry": "IT",
            },
            "areaServed": {"@type": "AdministrativeArea", "name": "Provincia di Varese"},
            "openingHoursSpecification": [
                {
                    "@type": "OpeningHoursSpecification",
                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    "opens": "08:00",
                    "closes": "18:00",
                }
            ],
        }
        out.append('<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + "</script>")
    return "\n".join("    " + l for l in out)


def top(meta):
    cur = meta["nav"]

    def link(href, label, cls=""):
        c = ' aria-current="page"' if href == cur else ""
        return f'<a href="{href}"{c}>{label}</a>'

    desk = "\n".join(f"            <li>{link(h, l)}</li>" for h, l in NAV)
    mob = "\n".join(f"      {link(h, l)}" for h, l in NAV)
    banner = (
        '  <aside class="demo-banner" aria-label="Avviso versione demo">VERSIONE DEMO - Proposta di sito non ancora attiva. '
        f'Per averla online sul vostro dominio contatta <a href="{TRAMONTIS}" target="_blank" rel="noopener">Tramontis</a></aside>\n'
        if not LIVE
        else ""
    )
    return f"""<a class="skip-link" href="#main">Vai al contenuto</a>
<div class="site-top">
{banner}  <header class="site-header">
    <div class="wrap site-header__in">
      <a class="brand" href="index.html" aria-label="{NAME}, vai alla home"><img src="assets/img/logo-hm-termoidraulica.png" width="439" height="113" alt="{NAME}"></a>
      <nav class="nav" aria-label="Menu principale">
        <ul class="nav__list">
{desk}
        </ul>
      </nav>
      <div class="header-actions">
        <a class="btn btn--sm" data-magnetic href="tel:{PHONE_TEL}">{icon("phone")}<span>Chiama</span></a>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Apri il menu">
          <svg class="ico i-open" aria-hidden="true" focusable="false"><use href="#i-menu"/></svg>
          <svg class="ico i-close" aria-hidden="true" focusable="false"><use href="#i-close"/></svg>
        </button>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Menu mobile" hidden>
{mob}
    </nav>
  </header>
</div>"""


def foot(meta):
    nav = "\n".join(f'          <li><a href="{h}">{l}</a></li>' for h, l in NAV)
    watermark = "" if LIVE else '\n<div class="demo-watermark" aria-hidden="true"></div>'
    return f"""<footer class="site-footer on-dark">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img src="assets/img/logo-hm-termoidraulica.png" width="439" height="113" alt="{NAME}" loading="lazy">
        <p>Impianti termoidraulici, caldaie, climatizzatori e ristrutturazioni a Gallarate e in provincia di Varese.</p>
      </div>
      <div>
        <h2>Contatti</h2>
        <ul class="footer__list">
          <li><a href="tel:{PHONE_TEL}">Tel {PHONE_DISPLAY}</a></li>
          <li><a href="{WA}" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="mailto:{EMAIL}">{EMAIL}</a></li>
          <li>Gallarate (VA)</li>
        </ul>
      </div>
      <div>
        <h2>Pagine</h2>
        <ul class="footer__list">
{nav}
          <li><a href="privacy.html">Privacy</a></li>
          <li><a href="note-legali.html">Note legali</a></li>
        </ul>
      </div>
      <div>
        <h2>Orari</h2>
        <ul class="footer__list">
          <li>Lunedì-Venerdì: 8:00-18:00</li>
          <li>Sabato e domenica: chiuso</li>
        </ul>
      </div>
    </div>
    <div class="footer__legal">
      <p>{NAME} - Gallarate (VA) - P.IVA {PIVA} - Tel {PHONE_DISPLAY} - {EMAIL}</p>
      <p class="footer__credit">Proposta di sito realizzata da <a href="{TRAMONTIS}" target="_blank" rel="noopener">Tramontis</a></p>
    </div>
  </div>
</footer>

<nav class="mbar" aria-label="Contatto rapido">
  <a class="btn" href="tel:{PHONE_TEL}">{icon("phone")}<span>Chiama</span></a>
  <a class="btn btn--wa" href="{WA}" target="_blank" rel="noopener">{icon("wa")}<span>WhatsApp</span></a>
</nav>{watermark}
{(ROOT / "tools/partials/sprite.html").read_text(encoding="utf-8").strip()}"""


def replace_region(html, name, content, path):
    pat = re.compile(rf"(<!--build:{name}-->)(.*?)(<!--/build:{name}-->)", re.S)
    if not pat.search(html):
        raise SystemExit(f"{path}: marcatore build:{name} mancante")
    return pat.sub(lambda m: f"{m.group(1)}\n{content}\n{m.group(3)}", html)


def main():
    for page, meta in PAGES.items():
        path = ROOT / page
        html = path.read_text(encoding="utf-8")
        html = replace_region(html, "head", head(page, meta), page)
        html = replace_region(html, "top", top(meta), page)
        html = replace_region(html, "foot", foot(meta), page)
        # punto di controllo demo: attributo data-demo sul body
        html = re.sub(r"<body\b[^>]*>", "<body>" if LIVE else "<body data-demo>", html, count=1)
        path.write_text(html, encoding="utf-8")

    urls = "\n".join(
        f"  <url><loc>{SITE}/{'' if p == 'index.html' else p}</loc></url>" for p in PAGES
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + urls
        + "\n</urlset>\n",
        encoding="utf-8",
    )
    if LIVE:
        robots = f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n"
    else:
        robots = "# DEMO: sito di prova non indicizzabile\nUser-agent: *\nDisallow: /\n"
    (ROOT / "robots.txt").write_text(robots, encoding="utf-8")
    (ROOT / ".nojekyll").write_text("", encoding="utf-8")
    print("Build completata:", "LIVE (demo rimossa)" if LIVE else "DEMO")


if __name__ == "__main__":
    main()
