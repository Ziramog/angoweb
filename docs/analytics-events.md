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

Native Google Ads conversion tags are not configured because Google Ads conversion labels were not provided. Do not invent labels. If Antonio/ANGO creates native Ads conversion actions later, add the real labels before firing `send_to` events.

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
