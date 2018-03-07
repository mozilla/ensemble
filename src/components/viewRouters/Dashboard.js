import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Dashboard').default;
    } catch (e) {
        View = require('../defaultViews/Dashboard').default;
    }

    return <View {...props} />;
}
