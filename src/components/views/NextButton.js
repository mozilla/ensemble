import React from 'react';

import './css/NextButton.css';


export default props => (
    <div className="next-button">
        <a href={props.to}>{props.text}</a>
    </div>
);
