import React from 'react';
import { Helmet } from 'react-helmet';

import { getPageTitle } from '../../lib/utils';


export default () => {
    const pageTitle = getPageTitle('Contact');
    const pageDescription = 'Contact us about the Firefox Public Data Report.';

    return (
        <React.Fragment>
            <Helmet>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta name="description" content={pageDescription} />
            </Helmet>
            <p id="contact">
                Please email us at
                {' '}<a href="mailto:fx-public-data@mozilla.com">fx-public-data@mozilla.com</a>
                {' '}with any questions about this report. We will respond as soon as possible.
            </p>
        </React.Fragment>
    );
};
