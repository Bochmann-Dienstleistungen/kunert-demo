/**
 * VALORIS — Cloudflare Worker: WhatsApp-Benachrichtigung bei Formular-Eingang
 *
 * SETUP (einmalig, 5 Minuten):
 * 1. CallMeBot aktivieren:
 *    → WhatsApp an +34 644 60 16 21 schicken: "I allow callmebot to send me messages"
 *    → Du bekommst eine API-Key-Antwort (z.B. 1234567)
 *
 * 2. Worker deployen:
 *    → Cloudflare Dashboard → Workers → Neuer Worker → Code einfügen
 *    → Environment Variables setzen:
 *       WA_PHONE  = 4915254190819   (ohne + und ohne 00)
 *       WA_APIKEY = [dein CallMeBot Key]
 *
 * 3. Formular-Action in index.html auf Worker-URL ändern:
 *    <form action="https://[dein-worker].workers.dev" method="POST">
 *
 * Worker-URL landet dann als Target der Forms — leitet nach Formspree weiter
 * UND sendet WhatsApp.
 */

export default {
  async fetch(request, env) {

    // CORS für lokale Previews
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return new Response('Bad request', { status: 400 });
    }

    // Felder aus Formular auslesen
    const name     = formData.get('name')            || '–';
    const telefon  = formData.get('telefon')         || '–';
    const email    = formData.get('email')           || '–';
    const nachricht= formData.get('nachricht')       || '';
    const kalkData = formData.get('kalkulator_daten')|| '';

    // WhatsApp-Nachricht aufbauen
    const lines = [
      `🔔 *Neue Anfrage – Kunert Renovierung*`,
      ``,
      `👤 *Name:* ${name}`,
      `📞 *Telefon:* ${telefon}`,
      `📧 *E-Mail:* ${email}`,
    ];

    if (kalkData) {
      lines.push(`🔧 *Kalkulator:* ${kalkData}`);
    }

    if (nachricht) {
      lines.push(`💬 *Nachricht:* ${nachricht}`);
    }

    lines.push(``, `⏱️ Jetzt zurückrufen — Lead ist heiß!`);

    const text = lines.join('\n');

    // ── Parallel: Formspree + WhatsApp ───────────────────────────────────────

    const waPhone  = env.WA_PHONE  || '';
    const waApiKey = env.WA_APIKEY || '';

    const [formspreeRes, waRes] = await Promise.allSettled([

      // 1) Formspree weiterleiten (Email an Frederic)
      fetch('https://formspree.io/f/mlgpooqw', {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' },
      }),

      // 2) WhatsApp via CallMeBot
      waPhone && waApiKey
        ? fetch(
            `https://api.callmebot.com/whatsapp.php?phone=${waPhone}&text=${encodeURIComponent(text)}&apikey=${waApiKey}`,
            { method: 'GET' }
          )
        : Promise.resolve({ ok: false, status: 0, statusText: 'No credentials' }),

    ]);

    // Logging (sichtbar im Cloudflare Dashboard → Logs)
    console.log('Formspree:', formspreeRes.status, formspreeRes.value?.status);
    console.log('WhatsApp: ', waRes.status,       waRes.value?.status);

    // Redirect zurück zur Danke-Seite (oder JSON für AJAX)
    const acceptHeader = request.headers.get('Accept') || '';
    if (acceptHeader.includes('application/json')) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Standard: Redirect zur Danke-URL
    return Response.redirect('https://bochmann-dienstleistungen.github.io/kunert-demo/?danke=1', 303);
  },
};
