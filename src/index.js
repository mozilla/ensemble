import React from 'react';
import { hydrate, render } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import Application from './components/views/Application';


// See the react-snap documentation
// https://github.com/stereobooster/react-snap#basic-usage-with-create-react-app
const root = document.getElementById('root');
const renderFn = root.hasChildNodes() ? hydrate : render;

renderFn((
    <BrowserRouter>
        <Application />
    </BrowserRouter>
), root);

registerServiceWorker();
