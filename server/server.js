import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

import renderReact from './middleware/renderReact';


// Use 5000 as the default port because 3000 is used by the local development
// server.
const defaultPort = 5000;

const port = process.env.PORT || defaultPort;

// The HTML file built by create-react-app
const indexPath = path.resolve(__dirname, '..', 'build', 'index.html');

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('common'));

fs.readFile(indexPath, 'utf8', (error, indexHTML) => {
    if (error) {
        // eslint-disable-next-line no-console
        return console.error('Error:', error);
    }

    // Use the renderReact middleware to render the root URL (/). If this is not
    // done, the server will return the static build/index.html page when the root
    // URL is visited.
    app.use('^/$', (req, res) => renderReact(req, res, indexHTML));

    // Serve all assets in the build directory
    app.use(express.static(path.resolve(__dirname, '..', 'build')));

    // Use the renderReact middleware for all other paths
    app.use('/*', (req, res) => renderReact(req, res, indexHTML));

    // Start the app
    app.listen(port, error => {
        if (error) {
            // eslint-disable-next-line no-console
            return console.error('Error:', error);
        }

        // eslint-disable-next-line no-console
        console.log(`Listening on port ${port}...`);
    });
});
