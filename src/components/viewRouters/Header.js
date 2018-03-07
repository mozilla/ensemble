import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Header').default;
    } catch (e) {
        View = require('../defaultViews/Header').default;
    }

    return <View {...props} />;
}
