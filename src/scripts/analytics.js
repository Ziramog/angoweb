const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const utms = {};

    UTM_KEYS.forEach((key) => {
        const value = params.get(key);
        if (value) {
            utms[key] = value;
            try {
                sessionStorage.setItem(`ango_${key}`, value);
            } catch {
                // Storage can be unavailable in private contexts. Tracking must not break UX.
            }
            return;
        }

        try {
            const storedValue = sessionStorage.getItem(`ango_${key}`);
            if (storedValue) utms[key] = storedValue;
        } catch {
            // Storage can be unavailable in private contexts. Tracking must not break UX.
        }
    });

    return utms;
}

function inferProductLine(pathname = window.location.pathname) {
    if (pathname.includes('repuestos-compatibles-urvig-micron')) return 'urvig_micron';
    if (pathname === '/' || pathname.includes('calculadora')) return 'rg_pto';
    return 'unknown';
}

function normalizeValue(value) {
    if (value === undefined || value === null || value === '') return undefined;
    return value;
}

function cleanParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
}

function sendAnalyticsEvent(eventName, eventParams = {}) {
    if (!eventName) return;

    const normalizedParams = cleanParams({
        page_path: window.location.pathname,
        page_location: window.location.href,
        product_line: normalizeValue(eventParams.product_line) || inferProductLine(),
        ...getUtmParams(),
        ...eventParams,
    });

    if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, normalizedParams);
    }

    window.dispatchEvent(new CustomEvent('ango:analytics-event', {
        detail: {
            event: eventName,
            params: normalizedParams,
        },
    }));
}

window.angoTrackEvent = sendAnalyticsEvent;
window.angoInferProductLine = inferProductLine;

// --- Google Ads native conversion -------------------------------------------
// Conversion action: "Contacto WhatsApp / Email / Teléfono" (categoría Contacto, evento manual,
// acción principal). Every real contact CTA — wa.me, tel: and mailto: — reports this same action.
// Google Ads account 685-746-1101, tag AW-18353350898.
// Label obtained from the Google Ads UI (Objetivos > Conversiones > Configuración de la etiqueta).
// It is public data (it ships inside the HTML), so it is the hardcoded default and can be
// overridden per build with PUBLIC_GOOGLE_ADS_CONVERSION_LABEL, same pattern as the IDs in Layout.astro.
const GOOGLE_ADS_CONVERSION_ID = 'AW-18353350898'; // same tag loaded in Layout.astro
const GOOGLE_ADS_CONVERSION_LABEL = 'yUOXCMTWybYdEPLRx69E';

function resolveAdsConversionLabel(override) {
    const raw = normalizeValue(override)
        || normalizeValue(import.meta.env.PUBLIC_GOOGLE_ADS_CONVERSION_LABEL)
        || GOOGLE_ADS_CONVERSION_LABEL;
    if (!raw) return undefined;
    // Accept either a bare label ("AbC-D_efGh") or a full send_to ("AW-18353350898/AbC-D_efGh").
    const label = String(raw).trim().split('/').pop();
    return label || undefined;
}

function angoTrackAdsConversion(opts = {}) {
    const label = resolveAdsConversionLabel(opts.label);
    if (!label) return false; // defensive: never break the submit if the label is emptied
    if (typeof window.gtag !== 'function') return false;

    const conversionParams = {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${label}`,
        value: Number.isFinite(opts.value) ? opts.value : 1,
        currency: 'ARS',
        // Beacon keeps the hit alive: the submit navigates to wa.me / mailto right after.
        transport_type: 'beacon',
    };

    if (typeof opts.event_callback === 'function') {
        conversionParams.event_callback = opts.event_callback;
        conversionParams.event_timeout = Number.isFinite(opts.event_timeout) ? opts.event_timeout : 800;
    }

    window.gtag('event', 'conversion', conversionParams);
    return true;
}

window.angoTrackAdsConversion = angoTrackAdsConversion;

// Contact CTAs that count as a real contact in Google Ads. Two ways in:
//  1. the data-event is an explicit contact event (hero / final / sticky / floating CTAs), or
//  2. the link itself is a contact transport (wa.me, tel:, mailto:). The part cards in the
//     repuestos-micron catalogue are real wa.me handoffs tagged `part_consulted`, so keying on the
//     event name alone would silently drop 13 of the 17 WhatsApp links on that page.
// Pure intent events (quote_form_started, model_viewed, catalog_downloaded) never match: they have
// no contact href, and counting them would inflate the conversion number.
const ADS_CONTACT_EVENTS = new Set(['whatsapp_clicked', 'phone_clicked', 'email_clicked']);
const ADS_CONTACT_HREF = /^(?:https?:\/\/(?:www\.)?wa\.me\/|tel:|mailto:)/i;

function isContactClick(target) {
    if (ADS_CONTACT_EVENTS.has(target.dataset.event)) return true;
    if (!(target instanceof HTMLAnchorElement)) return false;
    const href = (target.href || target.getAttribute('href') || '').trim();
    return ADS_CONTACT_HREF.test(href);
}

// One conversion per click: the same event object can only be handled once, and a rapid double
// click on the same element (finger bounce, nested [data-event] wrapper) is collapsed too.
const ADS_CONVERSION_DEDUPE_MS = 1500;
const adsConversionLastFired = new WeakMap();

function trackContactConversion(event, target) {
    if (!isContactClick(target)) return;
    if (event.__angoAdsConversionTracked) return;
    event.__angoAdsConversionTracked = true;

    const now = Date.now();
    const lastFired = adsConversionLastFired.get(target);
    if (lastFired && now - lastFired < ADS_CONVERSION_DEDUPE_MS) return;
    adsConversionLastFired.set(target, now);

    // Must run before the browser follows the link; transport_type=beacon keeps the hit alive.
    angoTrackAdsConversion();
}

document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-event]') : null;
    if (!target) return;
    if (target.dataset.trackClick === 'false') return;

    sendAnalyticsEvent(target.dataset.event, {
        cta_location: target.dataset.location,
        product_line: target.dataset.productLine === 'auto' ? inferProductLine() : target.dataset.productLine,
        ad_group_intent: target.dataset.adGroupIntent,
        part: target.dataset.part,
        urvig_code: target.dataset.urvigCode,
        micron_code: target.dataset.micronCode,
        link_url: target instanceof HTMLAnchorElement ? target.href : undefined,
        link_text: target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120),
    });

    trackContactConversion(event, target);
});

document.addEventListener('ango:conversion-intent', (event) => {
    const detail = event.detail || {};
    sendAnalyticsEvent(detail.event, {
        cta_location: detail.location,
        product_line: detail.product_line,
        ad_group_intent: detail.ad_group_intent,
        part: detail.part,
        urvig_code: detail.urvig_code,
        micron_code: detail.micron_code,
        form_name: detail.form_name,
    });
});
