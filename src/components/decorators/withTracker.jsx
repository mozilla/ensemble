import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ReactGA from 'react-ga4';


// The checked-in .env holds a placeholder, and loading gtag for it only takes
// bandwidth from the page while it loads.
const placeholderMeasurementId = 'G-XXXXXXXXXX';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
const analyticsEnabled = Boolean(measurementId) && measurementId !== placeholderMeasurementId;

// gtag sends a page view on its own when it is configured. Turn that off so
// the first page isn't counted twice: every page view, including the first,
// is sent below when the path changes.
if (analyticsEnabled) {
    ReactGA.initialize(measurementId, {
        gtagOptions: { send_page_view: false },
    });
}

export default WrappedComponent => props => {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        // gtag sends queued views once its script arrives, and without a
        // page_location it would record the address at that moment, which may
        // be a later page.
        if (analyticsEnabled) {
            ReactGA.send({ hitType: 'pageview', page: pathname, location: window.location.origin + pathname + search + hash });
        }
    }, [pathname]);

    return <WrappedComponent {...props} />;
};
