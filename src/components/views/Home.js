import React from 'react';
import Helmet from 'react-helmet';

import { getPageTitle } from '../../lib/utils';

import './css/Home.css';


export default () => (
    <React.Fragment>
        <Helmet>
            <title>{getPageTitle()}</title>
            <meta name="description" content="The Firefox Public Data Report is a weekly public report on the activity, behavior, and hardware configuration of Firefox Desktop users." />
        </Helmet>
        <article id="introduction">
            <p>
                This is a demo of the Firefox Public Data Report website which uses
                fake data.
            </p>
        </article>
    </React.Fragment>
);
