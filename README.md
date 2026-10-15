# HM Termoidraulica - proposta di sito (DEMO)

Sito statico (HTML + CSS + JS, nessun framework, nessuna dipendenza) per HM Termoidraulica, Gallarate (VA).
Proposta realizzata da [Tramontis](https://tramontis.netlify.app/), **non ancora attiva**.

```
index.html  servizi.html  offerte.html  contatti.html  privacy.html  note-legali.html
assets/css/style.css      assets/js/main.js      assets/img/      assets/fonts/
data/offerte.json         tools/build.py         sitemap.xml  robots.txt  .nojekyll
```

## Provarlo in locale

Basta aprire `index.html` con un doppio clic: nessun server necessario (le offerte sono già scritte nell'HTML). Se preferisci un server locale:

```bash
python3 -m http.server 8000     # poi apri http://localhost:8000
```

## Modificare i dati

| Cosa | Dove |
|---|---|
| Offerte (prezzi, testi, voci incluse, immagini) | Modifica `data/offerte.json` (`prezzo_da` è solo il numero, es. `1500`), poi lancia `python3 tools/build.py`: Home e Offerte vengono riscritte con i nuovi dati. |
| Note su detrazioni e rate | `data/offerte.json`, chiave `note` (poi `python3 tools/build.py`) |
| Dati societari (ragione sociale, via, P.IVA) | Costanti in cima a `tools/build.py` (`LEGAL_NAME`, `STREET`, `ADDRESS`, `PIVA`) per footer e JSON-LD; poi i testi in `privacy.html`, `note-legali.html`, `contatti.html` e `index.html` (cerca `Curtatone`). |
| Telefono, email, WhatsApp, orari | Si ripetono in più punti: cerca `3463562540`, `hmtermoidraulica1@gmail.com`, `03876450127` in tutti i file (`tools/build.py` per header/footer/JSON-LD). Gli orari stanno nelle tabelle di `index.html` e `contatti.html` e nel footer (`tools/build.py`). |
| Testi dei servizi | `servizi.html` (dettaglio) e griglia in `index.html` |
| FAQ | in fondo a `index.html` |
| Colori e font | variabili `:root` all'inizio di `assets/css/style.css` |

**Header, footer, banner demo e `<head>`** sono comuni a tutte le pagine e stanno tra i marcatori `<!--build:...-->`. Si modificano in `tools/build.py` e si rigenerano con:

```bash
python3 tools/build.py
```

Lo script riscrive anche le card delle offerte (da `data/offerte.json`). Il resto del contenuto delle pagine (dentro `<main>`) non viene mai toccato.

## Aggiungere foto

1. Metti l'immagine ottimizzata (WebP + JPEG di riserva, non oltre la risoluzione originale) in `assets/img/`.
2. Offerte: aggiungi il blocco nell'array `offerte` di `data/offerte.json` (`webp`, `jpg`, `width`, `height`, `alt`; `fit` = `contain` per prodotti su fondo bianco, `cover` per foto a pieno riquadro).
3. Altre pagine: usa `<img src="..." width=".." height=".." alt="..." loading="lazy">` indicando sempre larghezza, altezza e testo alternativo.

## Togliere la demo (quando il cliente acquista)

Un solo punto di controllo: l'attributo `data-demo` sul `<body>`.

- **Metodo consigliato (definitivo):** `python3 tools/build.py --live`
  Toglie in tutte le pagine banner, filigrana, `noindex`, prefisso `[DEMO]` nel titolo e `data-demo`; riscrive `robots.txt` (indicizzazione consentita) e `sitemap.xml`.
- **Metodo rapido a mano:** cancella `data-demo` dal `<body>`: banner e filigrana spariscono (CSS) e il JS rimuove `noindex` e `[DEMO]`. Per i motori di ricerca è meglio il metodo definitivo, perché `noindex` resta nel codice HTML.
- Il footer contiene la riga "Proposta di sito realizzata da Tramontis": se non serve più, rimuovila da `tools/build.py` (funzione `foot`) e rilancia lo script.
- Prima di andare online: fai confermare al titolare ragione sociale e indirizzo (presi da registri pubblici online) e la data della privacy, e verifica che `og:image`/JSON-LD usino il dominio definitivo (`SITE` in `tools/build.py`).

## Pubblicare

Sito statico: basta caricare la cartella così com'è.

- **GitHub Pages / Netlify / Cloudflare Pages:** punta alla radice del repository, nessun build.
- **Hosting tradizionale (FTP):** carica tutti i file e le cartelle nella root del dominio.
- Percorsi relativi, quindi funziona anche in una sottocartella. `.nojekyll` è già presente.

## Note tecniche

- Font self-hosted (Bricolage Grotesque e Plus Jakarta Sans, licenza OFL, in `assets/fonts/`).
- Animazioni solo con CSS, Web Animations API e IntersectionObserver; tutto ridotto con `prefers-reduced-motion`.
- Nessuno script di terze parti, nessun tracciamento, nessun cookie proprio. Unica risorsa esterna: la mappa Google incorporata in `contatti.html` (iframe senza chiave API). Contatti via `tel:`, WhatsApp e `mailto:` precompilato.
