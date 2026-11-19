import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ReactGA from 'react-ga4';


// The checked-in .env holds a placeholder, and loading gtag for it only takes
// bandwidth from the page while it loads.
const placeholderMeasurementId = 'G-XXXXXXXXXX';
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

function afterLoad() {
    return new Promise(resolve => {
        if (document.readyState === 'complete') {
            resolve();
        } else {
            window.addEventListener('load', () => resolve(), { once: true });
        }
    });
}

// gtag sends a page view on its own when it is configured. Turn that off so
// the first page isn't counted twice: every page view, including the first,
// is sent below when the path changes. Page views wait for initialisation,
// because ones sent earlier would reach gtag before its configuration.
const analyticsReady = measurementId && measurementId !== placeholderMeasurementId
    ? afterLoad().then(() => ReactGA.initialize(measurementId, {
        gtagOptions: { send_page_view: false },
    }))
    : null;

export default WrappedComponent => props => {
    const page = useLocation().pathname;

    useEffect(() => {
        analyticsReady?.then(() => ReactGA.send({ hitType: 'pageview', page }));
    }, [page]);

    return <WrappedComponent {...props} />;
};
