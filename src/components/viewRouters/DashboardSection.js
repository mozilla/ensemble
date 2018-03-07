import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/DashboardSection').default;
    } catch (e) {
        View = require('../defaultViews/DashboardSection').default;
    }

    return <View {...props} />;
}
