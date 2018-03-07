import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import Application from './components/viewRouters/Application';


ReactDOM.render((
    <BrowserRouter>
        <Application />
    </BrowserRouter>
), document.getElementById('root'));

registerServiceWorker();
