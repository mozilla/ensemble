import { Routes, Route, useLocation } from 'react-router';

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

export default () => {
    const { pathname } = useLocation();

    return (
        <main className={pathname.startsWith('/dashboard/') ? 'dashboard-route' : undefined}>
            {/* Keyed on the route so that a page whose code failed to load
                doesn't leave "Load error" on every other page: the key
                change remounts the boundary, resetting its error state. */}
            <LazyBoundary key={pathname}>
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
