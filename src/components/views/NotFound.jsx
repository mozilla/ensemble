import React from 'react';
import { Helmet } from 'react-helmet-async';

import ErrorComponent from './Error';
import { getPageTitle } from '../../lib/utils';


export default () => (
    <React.Fragment>
        <Helmet>
            <title>{getPageTitle('Not Found')}</title>
            <meta name="robots" content="noindex" />
        </Helmet>
        <ErrorComponent id="not-found" title="Not Found" pageHeading />
    </React.Fragment>
);
