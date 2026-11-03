# ANGO — GA4 / Google Ads measurement

## Google tag installation

The site loads Google tags directly through one `gtag.js` installation from `src/layouts/Layout.astro`.

GA4 Measurement ID:

```text
G-JX8JKF9ELH
```

Google Ads / AW ID:

```text
AW-18353350898
```

The implementation accepts `PUBLIC_GA4_MEASUREMENT_ID` and `PUBLIC_GOOGLE_ADS_ID` at build time and falls back to the production IDs above.

No GTM container is installed in this repo. To avoid duplicate tag loading, the layout loads a single `gtag.js` script and calls both:

```js
gtag('config', 'G-JX8JKF9ELH');
gtag('config', 'AW-18353350898');
```

## Final Google Ads URLs

Use one campaign naming convention:

```text
utm_source=google
utm_medium=cpc
utm_campaign=ango_search_compatibles_rg_2026
utm_content={adgroupid}
utm_term={keyword}
```

### Compatibles Urvig

```text
https://www.angometalurgica.com.ar/repuestos-compatibles-urvig-micron/?utm_source=google&utm_medium=cpc&utm_campaign=ango_search_compatibles_rg_2026&utm_content={adgroupid}&utm_term={keyword}
```

### Compatibles Micron

```text
https://www.angometalurgica.com.ar/repuestos-compatibles-urvig-micron/?utm_source=google&utm_medium=cpc&utm_campaign=ango_search_compatibles_rg_2026&utm_content={adgroupid}&utm_term={keyword}
```

### Productos RG / PTO industrial

```text
https://www.angometalurgica.com.ar/?utm_source=google&utm_medium=cpc&utm_campaign=ango_search_compatibles_rg_2026&utm_content={adgroupid}&utm_term={keyword}
```

## Event parameters

All events include:

| Parameter | Meaning |
|---|---|
| `page_path` | Current URL path. |
| `page_location` | Full URL. |
| `product_line` | `rg_pto`, `urvig_micron`, or `unknown`. |
| `utm_source` | Preserved from URL/session when present. |
| `utm_medium` | Preserved from URL/session when present. |
| `utm_campaign` | Preserved from URL/session when present. |
| `utm_content` | Preserved from URL/session when present. |
| `utm_term` | Preserved from URL/session when present. |
| `cta_location` | Stable CTA/form location. |

## Implemented events

| Event | Product line | Where it fires |
|---|---|---|
| `whatsapp_clicked` | `rg_pto` / `urvig_micron` / inferred | WhatsApp hero, repuestos cards, sticky FAB, landing CTAs, form-to-WhatsApp submits. |
| `phone_clicked` | inferred / `urvig_micron` | Footer phone and landing phone CTA. |
| `email_clicked` | inferred / `urvig_micron` / `rg_pto` | Footer email, landing email CTA, desktop RG quote submit. |
| `lead_form_submitted` | `rg_pto` | Home RG/PTO quote form after valid submit. |
| `lead_form_submitted` | `urvig_micron` | Urvig/Micron compatibility form after valid submit. |
| `quote_form_started` | `rg_pto` / `urvig_micron` | First interaction with quote forms and hero secondary CTA. |
| `catalog_downloaded` | `rg_pto` | RG technical catalog PDF download. |
| `calculator_started` | `rg_pto` | First calculator input/change. |
| `calculator_submitted` | `rg_pto` | Calculator valid calculation. |
| `part_consulted` | `urvig_micron` | Per-part catalog WhatsApp consult links. |
| `model_viewed` | `rg_pto` / `urvig_micron` | Model/compatible-parts navigation CTAs. |

## Google Ads conversion setup

Current method: import existing GA4 events into Google Ads as conversions.

Mark as primary conversions:

```text
lead_form_submitted
whatsapp_clicked
phone_clicked
```

Keep as secondary/observation:

```text
email_clicked
catalog_downloaded
calculator_submitted
part_consulted
quote_form_started
```

Do not optimize the initial campaign for pageviews or scroll.

## Native Google Ads conversion (lead form)

The Ads conversion action "Envío de formulario para clientes potenciales" (source: Sitio web, manual event, account `685-746-1101`) fires natively from `angoTrackAdsConversion(opts)` in `src/scripts/analytics.js`. That helper is called by the two quote-form submits, right before the outbound navigation:

- `src/components/Specs.astro` (home RG/PTO quote form, before `wa.me` / `mailto`)
- `src/pages/repuestos-compatibles-urvig-micron.astro` (compatibility form, before `wa.me`)

Label in use:

```text
AW-18353350898/hcnOCLy3ybEdEPLRx69E
```

The label is public data (it ships inside the HTML), so it is hardcoded as the fallback and can be overridden per build, exactly like the IDs in `Layout.astro`:

```js
const GOOGLE_ADS_CONVERSION_LABEL = import.meta.env.PUBLIC_GOOGLE_ADS_CONVERSION_LABEL || 'hcnOCLy3ybEdEPLRx69E';
```

No env var is required for production: the default label is committed, so a plain `npm run build` + deploy already records conversions. Set `PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` only to point a build at a different conversion action. The helper is defensive (if the label were emptied it returns without calling `gtag`), and every valid submit sends:

```js
gtag('event', 'conversion', {
  send_to: 'AW-18353350898/hcnOCLy3ybEdEPLRx69E',
  value: 1,
  currency: 'ARS',
  transport_type: 'beacon'
});
```

How to read or refresh the label in Google Ads:

1. Google Ads > Objetivos > Conversiones > open the action "Envío de formulario para clientes potenciales".
2. Open "Configuración de la etiqueta" (Tag setup) and choose "Instalar la etiqueta manualmente" (or "Usar la etiqueta de Google" and inspect the snippet).
3. The snippet contains `send_to: 'AW-18353350898/hcnOCLy3ybEdEPLRx69E'`. Copy only the part after the slash as the label. The label is unique per conversion action: never reuse or invent one.

Why `transport_type: 'beacon'`: both submits leave the page right after firing (mobile uses `window.open` to `wa.me`, desktop assigns `location.href` to a `mailto:`). A regular `image`/`xhr` hit can be cancelled by that navigation; `beacon` uses `navigator.sendBeacon`, which survives the unload, so the conversion is not lost. The helper also accepts an optional `event_callback` (plus `event_timeout`, default 800 ms) and forwards it to `gtag`.

Do not add GTM or a second gtag.js for this: the existing `gtag('config', 'AW-18353350898')` in `Layout.astro` stays as is, and the conversion event rides on the same tag.



## Manual checks after deploy

1. Open GA4 Realtime or DebugView for the ANGO property.
2. Visit the home with the RG/PTO UTM URL.
3. Click WhatsApp hero and confirm `whatsapp_clicked` with `product_line=rg_pto`.
4. Submit the RG/PTO quote form with valid test data and confirm `lead_form_submitted`.
5. Download the RG PDF and confirm `catalog_downloaded`.
6. Use the calculator and confirm `calculator_started` and `calculator_submitted`.
7. Visit the Urvig/Micron landing with the UTM URL.
8. Click a part consult and confirm `part_consulted` with the part codes.
9. Submit the Urvig/Micron form with valid test data and confirm `lead_form_submitted` with `product_line=urvig_micron`.
10. Click phone/email CTAs and confirm `phone_clicked` / `email_clicked`.

## Files touched

- `src/layouts/Layout.astro`
- `src/scripts/analytics.js`
- `src/components/Hero.astro`
- `src/components/Specs.astro`
- `src/components/Models.astro`
- `src/components/Spares.astro`
- `src/components/Footer.astro`
- `src/pages/repuestos-compatibles-urvig-micron.astro`
- `src/pages/calculadora.astro`
- `docs/analytics-events.md`
