import { useLayoutEffect, useRef } from 'react';
import { Routes, Route, matchPath, useLocation, useNavigationType } from 'react-router';

import withTracker from '../decorators/withTracker';
import withNextButton from '../decorators/withNextButton';
import lazyLoad from '../../lib/lazyLoad';
import LazyBoundary from '../../lib/LazyBoundary';

import { dashboards } from '../../config.json';


// Created once, so that a page already visited renders straight away when it
// is visited again.
const Home = withTracker(withNextButton(lazyLoad(() => import('./Home'))));
const Contact = withTracker(lazyLoad(() => import('./Contact')));
const DashboardContainer = withTracker(withNextButton(lazyLoad(() => import('../containers/DashboardContainer'))));
const NotFound = withTracker(withNextButton(lazyLoad(() => import('./NotFound'))));

// Matched as Routes matches them, so that a Not Found page under /dashboard/
// keeps the short-page layout.
const isDashboardPath = pathname => dashboards.some(
    dashboard => matchPath(`/dashboard/${dashboard.key}`, pathname)
);

const pageHeadingSelector = '[data-page-heading]';

// After a navigation, do what a full page load would: open the new page at the
// top and start focus there, on its heading, which a screen reader then reads.
// Back and forward keep the scroll position the browser restores. Until the
// heading renders, main holds focus; the heading takes it on arrival unless the
// reader has moved focus elsewhere by then.
function focusPageHeading(main) {
    const focusWithoutScrolling = element => element.focus({ preventScroll: true });
    const heading = main.querySelector(pageHeadingSelector);
    if (heading) {
        focusWithoutScrolling(heading);
        return null;
    }

    focusWithoutScrolling(main);
    const observer = new MutationObserver(() => {
        const arrivedHeading = main.querySelector(pageHeadingSelector);
        if (!arrivedHeading) return;
        if (document.activeElement === main) focusWithoutScrolling(arrivedHeading);
        observer.disconnect();
    });
    observer.observe(main, { childList: true, subtree: true });
    return observer;
}

export default () => {
    const { pathname } = useLocation();
    const navigationType = useNavigationType();
    const mainElement = useRef(null);
    const isFirstPage = useRef(true);

    // BrowserRouter leaves scrolling and focus where they were, and a page
    // visited before renders at full height at once, so without this a new
    // page would open part way down with focus lost. The first page is left
    // to the browser, as on any page load.
    useLayoutEffect(() => {
        if (isFirstPage.current) {
            isFirstPage.current = false;
            return undefined;
        }
        if (navigationType !== 'POP') {
            window.scrollTo(0, 0);
        }
        const observer = focusPageHeading(mainElement.current);
        return () => observer?.disconnect();
    }, [pathname, navigationType]);

    return (
        <main
            ref={mainElement}
            tabIndex={-1}
            className={isDashboardPath(pathname) ? 'dashboard-route' : undefined}
        >
            {/* Keyed on the route so that a page whose code failed to load
                doesn't leave "Load error" on every other page: the key
                change remounts the boundary, resetting its error state. */}
            <LazyBoundary key={pathname} loadingLabel="Loading page" pageHeading>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/contact" element={<Contact />} />
                    {dashboards.map(dashboard => (
                        <Route
                            key={dashboard.key}
                            path={`/dashboard/${dashboard.key}`}
                            element={<DashboardContainer source={dashboard.source} />}
                        />
                    ))}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </LazyBoundary>
        </main>
    );
};
