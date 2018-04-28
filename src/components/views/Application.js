import React from 'react';

import Header from './Header';
import Main from './Main';
import '../../lib/polyfills';

import './css/Application.css';


export default () => (
    <div id="application">
        <Header />
        <Main />
    </div>
);
