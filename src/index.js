import React from 'react';
import { render as reactSnapshotRender } from 'react-snapshot';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import Application from './components/views/Application';


reactSnapshotRender((
    <BrowserRouter>
        <Application />
    </BrowserRouter>
), document.getElementById('root'));

registerServiceWorker();
