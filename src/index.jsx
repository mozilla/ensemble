// Polyfills for older browsers. We can get rid of these if our tests are
// thorough enough and if they pass in enough of the most commonly-used browsers
// according to GA.
//
// react-app-polyfill needs to be the first import, according to its
// documentation.
//
// babel-polyfill is big, but importing modules as-needed from core-js is a game
// of whack-a-mole. We did use core-js in the past, but even after importing
// many individual modules we were left unsure that we had covered everything.
import 'react-app-polyfill/ie11';
import 'babel-polyfill';

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { unregister } from './registerServiceWorker';

import Application from './components/views/Application';


ReactDOM.render((
    <BrowserRouter>
        <Application />
    </BrowserRouter>
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
