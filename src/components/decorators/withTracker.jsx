import { useEffect } from 'react';
import { useLocation } from 'react-router';
import ReactGA from 'react-ga4';


// gtag sends a page view on its own when it is configured. Turn that off so
// the first page isn't counted twice: every page view, including the first,
// is sent below when the path changes.
ReactGA.initialize(import.meta.env.VITE_GA_MEASUREMENT_ID, {
    gtagOptions: { send_page_view: false },
});

export default WrappedComponent => props => {
    const page = useLocation().pathname;

    useEffect(() => {
        ReactGA.send({ hitType: 'pageview', page });
    }, [page]);

    return <WrappedComponent {...props} />;
};
