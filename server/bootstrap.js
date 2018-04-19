// Based on the following blog post:
// https://medium.com/bucharestjs/upgrading-a-create-react-app-project-to-a-ssr-code-splitting-setup-9da57df2040a

require('ignore-styles');
require('babel-register')({
    ignore: [/(node_modules)/],
    presets: ['es2015', 'react-app']
});
require('./index');
