import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import registerServiceWorker from './registerServiceWorker';

import Layout from './components/views/Layout';


ReactDOM.render((
    <BrowserRouter>
        <Layout />
    </BrowserRouter>
), document.getElementById('root'));

registerServiceWorker();
