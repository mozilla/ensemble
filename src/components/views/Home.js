import React from 'react';
import Helmet from 'react-helmet';

import { getPageTitle } from '../../lib/utils';

import './css/Home.css';


export default () => (
    <React.Fragment>
        <Helmet>
            <title>{getPageTitle()}</title>
        </Helmet>
        <article id="introduction">
            <p>
                This is a demo of the Firefox Public Data Report website which uses
                fake data.
            </p>
        </article>
    </React.Fragment>
);
