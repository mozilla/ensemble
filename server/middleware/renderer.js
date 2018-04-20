// Based on the following blog post:
// https://medium.com/bucharestjs/upgrading-a-create-react-app-project-to-a-ssr-code-splitting-setup-9da57df2040a

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router';
import path from 'path';
import fs from 'fs';

import Application from '../../src/components/views/Application';


export default (req, res, next) => {
    // Point to the HTML file created by CRA's build tool
    const indexPath = path.resolve(__dirname, '..', '..', 'build', 'index.html');

    const context = {};

    fs.readFile(indexPath, 'utf8', (error, indexHTML) => {
        if (error) {
            console.error('Error:', error);
            return res.status(500).end();
        }

        // Render the app as a string
        const appHTML = ReactDOMServer.renderToString(
            <StaticRouter context={context}>
                <Application />
            </StaticRouter>
        );

        console.log(context);

        const statusAttribute = 'data-http-status';
        if (appHTML.includes(statusAttribute)) {
            const appElement = document.createElement('div').innerHTML(appHTML);
            const errorElement = appElement.querySelector(`.error[${statusAttribute}]`);
            const statusCode = errorElement.getAttribute(statusAttribute);
            res.status(statusCode);
        }

        // Inject the application's rendered HTML into the index page's HTML and
        // send it
        return res.send(
            indexHTML.replace(
                '<div id="root"></div>',
                `<div id="root">${appHTML}</div>`
            )
        );
    });
}
