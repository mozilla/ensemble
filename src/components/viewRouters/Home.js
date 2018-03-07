import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Home').default;
    } catch (e) {
        View = require('../defaultViews/Home').default;
    }

    return <View {...props} />;
}
