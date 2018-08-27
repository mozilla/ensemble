import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { unregister } from './registerServiceWorker';

import './lib/polyfills';

import Application from './components/views/Application';


ReactDOM.render((
    <HashRouter>
        <Application />
    </HashRouter>
), document.getElementById('root'));

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
