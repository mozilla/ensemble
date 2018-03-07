import React from 'react';


export default props => {
    let View;

    try {
        View = require('../../config/templates/Error').default;
    } catch (e) {
        View = require('../defaultViews/Error').default;
    }

    return <View {...props} />;
}
