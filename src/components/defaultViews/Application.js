import React from 'react';

import Header from '../viewRouters/Header';
import Main from '../viewRouters/Main';

import './css/Application.css';
import './css/Spinner.css';


export default () => (
    <div id="application">
        <Header />
        <Main />
    </div>
);
