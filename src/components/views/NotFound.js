import React from 'react';

import HTTPStatus from './HTTPStatus';
import ErrorComponent from './Error';


export default () => (
    <HTTPStatus code={404}>
        <ErrorComponent
            id="not-found"
            title="Not Found"
        />
    </HTTPStatus>
);
