import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, matchPath } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { unregister } from './registerServiceWorker';

import Application from './components/views/Application';
import { prefetchJSON } from './lib/withFetch';
import { dashboardIndexUrl } from './lib/utils';
import { dashboards } from './config.json';


// A dashboard's data doesn't depend on its code, which is much bigger, so ask
// for the data now rather than once the code has arrived.
const dashboard = dashboards.find(
    ({ key }) => matchPath(`/dashboard/${key}`, window.location.pathname)
);
if (dashboard) {
    prefetchJSON(dashboardIndexUrl(dashboard.source));
}


// React's first render replaces the header copy in index.html, whose links a
// visitor may already have tabbed to. Render synchronously so that nothing
// can move focus in between, then give it to the same link in React's header.
const focusedHref = document.activeElement?.closest('.app-shell a')?.getAttribute('href');
const root = createRoot(document.getElementById('root'));
flushSync(() => root.render(
    <HelmetProvider>
        <BrowserRouter>
            <Application />
        </BrowserRouter>
    </HelmetProvider>
));
if (focusedHref) {
    [...document.querySelectorAll('#main-header a')]
        .find(link => link.getAttribute('href') === focusedHref)
        ?.focus();
}

// Imported dynamically, after rendering, because content blockers may block
// this module by its name, and a failed static import would stop the whole
// site from loading. A blocked import just means no analytics.
import('./lib/measure')
    .then(({ initPlausible }) => initPlausible())
    .catch(() => {});

// Service workers were causing issues with DataOps hosting. We struggled to
// understand what exactly was causing the problem. It's possible that #5 in the
// following list has something to do with it (we didn't notice that guideline
// until after the site was first hosted) but it's not clear.
//
// https://github.com/facebook/create-react-app/blob/ca5998326deebf79845ca00f616b8dad11d90509/packages/react-scripts/template/README.md#offline-first-considerations
//
// Regardless, we decided that disabling caching entirely was the easiest
// solution.
//
// https://github.com/facebook/create-react-app/blob/ca5998326deebf79845ca00f616b8dad11d90509/packages/react-scripts/template/README.md#opting-out-of-caching
unregister();
