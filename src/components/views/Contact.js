import React from 'react';
import Helmet from 'react-helmet';

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
                Please use the
                {' '}<a href="https://discourse.mozilla.org/c/fx-public-data">Firefox Public Data forum</a>
                {' '}if you have any questions about this report.
            </p>
        </React.Fragment>
    );
};
