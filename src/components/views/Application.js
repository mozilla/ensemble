import React from 'react';
import Helmet from 'react-helmet';

import Header from './Header';
import Main from './Main';
import Footer from './Footer';

import './css/Application.css';
import './css/BrowserHacks.css';


export default props => {
    let maybeGraphURL = null;
    if (window.location.href) {
        maybeGraphURL = (
            <meta
                property="og:url"
                content={window.location.href}
            />
        );
    }

    return (
        <div id="application">
            <Helmet>
                {maybeGraphURL}
            </Helmet>
            <Header
                regionlessDashboards={props.regionlessDashboards}
                preferredRegion={props.preferredRegion}
            />
            <Main
                regionlessDashboards={props.regionlessDashboards}
                preferredRegion={props.preferredRegion}
            />
            <Footer />
        </div>
    );
};
