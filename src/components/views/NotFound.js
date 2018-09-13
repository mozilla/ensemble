import React from 'react';
import Helmet from 'react-helmet';

import ErrorComponent from './Error';


export default () => (
    <React.Fragment>
        <Helmet>
            <meta name="robots" content="noindex" />
        </Helmet>
        <ErrorComponent id="not-found" title="Not Found" />
    </React.Fragment>
);
