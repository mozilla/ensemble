import React from 'react';

import './css/StripedHeader.css';


export default props => {
    return React.createElement(
        props.tag,
        {class: 'striped'},
        <span>{props.label}</span>
    );
};
