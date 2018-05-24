import React from 'react';

import Header from './Header';
import Main from './Main';
import Footer from './Footer';

import './css/Application.css';
import './css/BadBrowsers.css';


export default () => (
    <div id="application">
        <Header />
        <Main />
        <Footer />
    </div>
);
