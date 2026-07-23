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
