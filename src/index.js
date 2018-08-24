import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import './lib/polyfills';

import Application from './components/views/Application';


ReactDOM.render((
    <HashRouter basename="/protected/usage-report-demo">
        <Application />
    </HashRouter>
), document.getElementById('root'));

registerServiceWorker();
