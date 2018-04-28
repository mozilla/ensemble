require('ignore-styles');
require('babel-register')({
    ignore: /(build|node_modules)/,
    presets: [
        'env',
        'react-app'
    ],
    plugins: [
        'syntax-dynamic-import',
        'dynamic-import-node',
        'react-loadable/babel',
    ],
});
require('./server');
