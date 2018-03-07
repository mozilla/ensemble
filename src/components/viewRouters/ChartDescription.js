import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/ChartDescription').default;
    } catch (e) {
        View = require('../defaultViews/ChartDescription').default;
    }

    return <View {...props} />;
}
