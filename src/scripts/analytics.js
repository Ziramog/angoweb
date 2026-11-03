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
// Conversion action: "Envío de formulario para clientes potenciales" (Sitio web, evento manual).
// Google Ads account 685-746-1101, tag AW-18353350898.
// Label obtained from the Google Ads UI (Objetivos > Conversiones > Configuración de la etiqueta).
// It is public data (it ships inside the HTML), so it is the hardcoded default and can be
// overridden per build with PUBLIC_GOOGLE_ADS_CONVERSION_LABEL, same pattern as the IDs in Layout.astro.
const GOOGLE_ADS_CONVERSION_ID = 'AW-18353350898'; // same tag loaded in Layout.astro
const GOOGLE_ADS_CONVERSION_LABEL = 'hcnOCLy3ybEdEPLRx69E';

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
