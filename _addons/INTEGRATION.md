# Ein-Klick Integration — Kalkulator + WhatsApp

## Was dazukommt
- **Kalkulator** — interaktives Tool auf der Startseite (neue Section vor dem CTA)
- **WhatsApp-Notify** — bei jeder Anfrage landet 5 Sek. später eine WhatsApp bei Kunert

---

## Schritt 1 — WhatsApp aktivieren (Kunert, 2 Min.)
1. WhatsApp öffnen, Nummer **+34 644 60 16 21** schreiben:  
   `I allow callmebot to send me messages`
2. CallMeBot antwortet mit einem API-Key (z.B. `7829341`)
3. Den Key weitergeben → wird in den Worker eingetragen

## Schritt 2 — Cloudflare Worker deployen (5 Min.)
1. cloudflare.com → Anmelden → **Workers & Pages → Create**
2. Code aus `worker-whatsapp.js` einfügen
3. **Settings → Environment Variables:**
   - `WA_PHONE`  = `4915490819XX` (Kunerts Nummer ohne +/00)
   - `WA_APIKEY` = [Key aus Schritt 1]
4. Deploy → Worker-URL notieren (z.B. `kunert-form.workers.dev`)

## Schritt 3 — In index.html einbauen (1 Min.)

### A) Kalkulator-Section einbauen
Folgendes **vor** `<section id="cta-strip"` einfügen:

```html
<!-- ═══════════ KALKULATOR ═══════════ -->
<section id="kalkulator" style="background:var(--cream);padding:5rem 5%">
  <div style="max-width:680px;margin:0 auto">
    <div style="text-align:center;margin-bottom:2.5rem">
      <div style="font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold2);margin-bottom:.6rem">Kostenschätzung</div>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:600;color:var(--black)">Was kostet Ihre Renovierung?</h2>
      <p style="margin-top:.6rem;font-size:.9rem;color:rgba(14,15,19,.55)">In 3 Schritten zur unverbindlichen Sofortschätzung</p>
    </div>
    <iframe src="kalkulator-preview.html" style="width:100%;height:680px;border:none;border-radius:14px;background:var(--dark)" title="Kostenrechner" loading="lazy"></iframe>
  </div>
</section>
```

### B) Worker als Formular-Target setzen
In **jeder** `<form action="...">` (kontakt.html + index.html):
```html
<!-- Alt: -->
<form action="https://formspree.io/f/mlgpooqw" ...>

<!-- Neu: -->
<form action="https://kunert-form.workers.dev" ...>
```
Der Worker leitet alles an Formspree weiter UND schickt WhatsApp.

### C) Kalkulator-Link im Menü (optional)
```html
<a href="#kalkulator">Kostenrechner</a>
```

---

## Ergebnis
- Jede Anfrage → sofort WhatsApp an Kunert
- Kalkulator qualifiziert Leads selbst (Leistung + Fläche + Zustand schon bekannt)
- Formspree bleibt als E-Mail-Backup aktiv
