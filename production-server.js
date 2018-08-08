const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');


require('dotenv').config();

const send200 = (req, res) => {
    res.sendStatus(200);
};

// Paths that should not 404
const knownPaths = [
    '/',
    '/dashboard/user-activity',
    '/dashboard/usage-behavior',
    '/dashboard/hardware',
];

const app = express();

app.use(helmet());
app.use(morgan('combined'));

app.use(express.static(path.join(__dirname, 'build')));

// Ops routes
app.get('/__heartbeat__', send200);
app.get('/__lbheartbeat__', send200);
app.get('/__version__', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'version.json'));
});

app.get('/*', (req, res) => {
    if (knownPaths.includes(req.path)) {
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
    } else {

        // If the requested path is unknown, send a 404 and render the "Not
        // Found" page. NB: This only works if the unkown path is the first to
        // be requested. If the user first requests a known path and then
        // navigates to an unkown path, the "Not Found" page will render but a
        // 404 will not be returned. This is because the JavaScript bundle never
        // needs to hit the server once it's been loaded. The bundle contains
        // all content, routing logic, etc.
        //
        // We could force a page reload every time the user navigates, but that
        // would hurt performance somewhat.

        res.status(404).sendFile(path.join(__dirname, 'build', 'index.html'));
    }
});

app.listen(process.env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Listening on port ${process.env.PORT}...`);
});
