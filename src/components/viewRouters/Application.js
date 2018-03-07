import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Application').default;
    } catch (e) {
        View = require('../defaultViews/Application').default;
    }

    return <View {...props} />;
}
