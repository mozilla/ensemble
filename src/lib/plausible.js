// Loads Plausible's tracker for every visitor, wherever they are, unless they
// have asked not to be tracked.
//
// The script is Plausible's per-site one, served from our own subdomain. It
// carries the site it reports to, so each environment's build picks its site
// by the script URL it is given, and counts a page view when
// the page loads and on every history.pushState, which is how the router
// navigates, so nothing here needs to send page views. Outbound link clicks,
// file downloads, and form submissions come with it, because they are turned on
// in the site's settings. It ignores localhost on its own.

// Global Privacy Control, or Do Not Track in either place browsers have put it.
// Each place is checked on its own, so one reading "unspecified" can't hide the
// other asking not to be tracked.
function analyticsDenied() {
    return navigator.globalPrivacyControl === true
        || [navigator.doNotTrack, window.doNotTrack].some(value => value === '1' || value === 'yes');
}

// A no-op when scriptUrl is empty, the visitor has opted out, or the tracker
// has already been set up. A scriptUrl that isn't an absolute URL is a
// misconfigured build, so it is reported with a warning and nothing is loaded,
// rather than throwing out of the caller.
export function initPlausible(scriptUrl = import.meta.env.VITE_PLAUSIBLE_SCRIPT_URL) {
    if (!scriptUrl || analyticsDenied() || window.plausible) {
        return;
    }

    // The tracker posts events to plausible.io unless told otherwise, so send
    // them to the origin the script came from, to stay first-party like the
    // script. Worked out before anything is set up, so a bad URL leaves nothing
    // half-done.
    let endpoint;
    try {
        endpoint = new URL('/api/event', scriptUrl).href;
    } catch {
        // eslint-disable-next-line no-console
        console.warn(`Plausible is not loaded: "${scriptUrl}" is not an absolute URL.`);
        return;
    }

    // Plausible's own snippet: queue calls made before the script has loaded,
    // and keep the options for the script to pick up when it does.
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
