import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Main').default;
    } catch (e) {
        View = require('../defaultViews/Main').default;
    }

    return <View {...props} />;
}
