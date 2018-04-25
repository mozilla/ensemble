import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import './lib/polyfills';

import Application from './components/views/Application';


ReactDOM.render((
    <BrowserRouter basename="/protected/usage-report-demo">
        <Application />
    </BrowserRouter>
), document.getElementById('root'));

registerServiceWorker();
