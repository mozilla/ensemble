import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import withTracker from '../decorators/withTracker';
import withNextButton from '../decorators/withNextButton';
import lazyLoad from '../../lib/lazyLoad';
import LazyBoundary from '../../lib/LazyBoundary';

import { dashboards } from '../../config.json';


export default () => {
    const { pathname } = useLocation();

    // Created on each render, which only happens on navigation, so a route
    // whose chunk failed to load retries the import when it is visited again.
    // React.lazy remembers a failed load for good.
    const Home = withTracker(withNextButton(lazyLoad(import('./Home'))));
    const Contact = withTracker(lazyLoad(import('./Contact')));
    const DashboardContainer = withTracker(withNextButton(lazyLoad(import('../containers/DashboardContainer'))));
    const NotFound = withTracker(withNextButton(lazyLoad(import('./NotFound'))));

    return (
        <main>
            {/* Keyed on the route so a failed chunk load doesn't brick every
                later navigation - the key change fully remounts the
                boundary, resetting its error state, instead of leaving
                "Load error" in place until a full page reload. */}
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
