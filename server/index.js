// Based on the following blog post:
// https://medium.com/bucharestjs/upgrading-a-create-react-app-project-to-a-ssr-code-splitting-setup-9da57df2040a

import express from 'express';
import path from 'path';

import serverRenderer from './middleware/renderer';


const port = process.env.PORT || 3000;

// Initialize the application and create the routes
const app = express();
const router = express.Router();

// Root (/) should always serve our server-rendered page
router.use('^/$', serverRenderer);

// Other static resources should just be served as they are
router.use(express.static(
    path.resolve(__dirname, '..', 'build'),
    { maxAge: '30d' },
));

router.use('*', serverRenderer);

// Tell the app to use the above rules
app.use(router);

// Start the app
app.listen(port, error => {
    if (error) {
        return console.error('Error:', error);
    }

    console.log(`listening on port ${port}...`);
});
