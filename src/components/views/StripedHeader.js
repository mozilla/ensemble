import React from 'react';

import './css/StripedHeader.css';


export default props => {
    return React.createElement(
        props.tag,
        {className: 'striped'},
        <span>{props.label}</span>
    );
};
