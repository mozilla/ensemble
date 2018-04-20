import React from 'react';

import Error from './Error';


export default () => (
    <Error
        id="not-found"
        title="Not Found"
        httpStatus={404}
    />
);
