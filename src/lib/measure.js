// Named measure.js because ad blockers block files named plausible.js or
// analytics.js. index.jsx still survives a blocked import, but then nothing
// is measured.
//
// The per-site script tracks page views itself, hooking history.pushState, so
// nothing here sends them. It also ignores localhost.

// Each Do Not Track location is checked on its own, so one reading
// "unspecified" can't hide the other asking not to be tracked.
function analyticsDenied() {
    return navigator.globalPrivacyControl === true
        || [navigator.doNotTrack, window.doNotTrack].some(value => value === '1' || value === 'yes');
}

// Only Plausible's per-site scripts on our own subdomain may run, so a build
// setting can't point the site at code from any other origin. Kept in step
// with the check in .github/workflows/deploy.yml.
const approvedScriptUrl = /^https:\/\/pa\.firefox\.com\/js\/pa-[\w-]+\.js$/;

// The tracker posts to plausible.io by default; keep events first-party.
const endpoint = 'https://pa.firefox.com/api/event';

// An unapproved scriptUrl warns rather than throws, so a misconfigured build
// still renders the site.
export function initPlausible(scriptUrl = import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL) {
    if (!scriptUrl || analyticsDenied() || typeof window.plausible === 'function') {
        return;
    }

    if (!approvedScriptUrl.test(scriptUrl)) {
        // eslint-disable-next-line no-console
        console.warn(`Plausible is not loaded: "${scriptUrl}" is not a pa.firefox.com per-site script.`);
        return;
    }

    window.plausible = function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
    };
    window.plausible.init = function (options) {
        window.plausible.o = options || {};
    };
    window.plausible.init({ endpoint });

    const script = document.createElement('script');
    script.async = true;
    script.src = scriptUrl;
    document.head.appendChild(script);
}
