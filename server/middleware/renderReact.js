import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from 'react-router';

import Application from '../../src/components/views/Application';


export default (req, res, indexHTML) => {
    // Render this page's content as a string
    const context = {};
    const pageHTML = ReactDOMServer.renderToString(
        <StaticRouter context={context} location={req.originalUrl}>
            <Application />
        </StaticRouter>
    );

    // Use the status code set by the application, if any
    if (pageHTML.includes('<div id="http-status"')) {
        const allowedStatusCodes = [404];

        const match = pageHTML.match(/<div id="http-status" data-code="(\d+)">/);
        if (match.length >= 2) {
            const statusCode = Number(match[1]);

            if (!isNaN(statusCode) && allowedStatusCodes.includes(statusCode)) {
                res.status(statusCode);
            }
        }
    }

    // Inject this page's rendered HTML into the index page's HTML and serve
    // it up
    return res.send(
        indexHTML.replace(
            '<div id="root"></div>',
            `<div id="root">${pageHTML}</div>`
        )
    );
};
