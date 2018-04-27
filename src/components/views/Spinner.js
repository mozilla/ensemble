import React from 'react';
import Spinner from 'react-spinkit';

import './css/Spinner.css';


/**
 * Simple wrapper for react-spinkit that uses some default options and applies
 * our custom styles.
 */
export default props => {
    return <Spinner name="circle" fadeIn="none" {...props} />;
};
