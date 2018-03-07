import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/ChartWrapper').default;
    } catch (e) {
        View = require('../defaultViews/ChartWrapper').default;
    }

    return <View {...props} />;
}
