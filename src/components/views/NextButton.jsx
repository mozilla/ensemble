import React from 'react';
import { Link } from 'react-router-dom';

import './css/NextButton.css';


export default props => (
    <div className="next-button">
        <Link to={props.to}>{props.text}</Link>
    </div>
);
