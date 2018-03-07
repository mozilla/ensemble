import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Chart').default;
    } catch (e) {
        View = require('../defaultViews/Chart').default;
    }

    return <View {...props} />;
}
