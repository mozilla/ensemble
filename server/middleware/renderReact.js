import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import { Capture } from 'react-loadable';

import Application from '../../src/components/views/Application';


export default (req, res, indexHTML) => {
    const modules = [];
    const context = {};

    // Render this page's content as a string
    const pageHTML = renderToString(
        <StaticRouter context={context} location={req.url}>
            <Capture report={m => modules.push(m)}>
                <Application />
            </Capture>
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
