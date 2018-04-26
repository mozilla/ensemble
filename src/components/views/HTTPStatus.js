import React from 'react';


export default props => (
    <div id="http-status" data-code={props.code}>
        {props.children}
    </div>
);
