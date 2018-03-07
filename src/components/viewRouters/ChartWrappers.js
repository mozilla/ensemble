import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/ChartWrappers').default;
    } catch (e) {
        View = require('../defaultViews/ChartWrappers').default;
    }

    return <View {...props} />;
}
