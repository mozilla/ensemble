/**
 * This file isn't used by the production server at all. It's only used by the
 * local development server, which does client-side rendering.
 */

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import Application from './components/views/Application';


render((
    <BrowserRouter forceRefresh={true}>
        <Application />
    </BrowserRouter>
), document.getElementById('root'));

registerServiceWorker();
