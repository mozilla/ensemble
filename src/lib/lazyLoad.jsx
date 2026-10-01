import React from 'react';


/**
 * Return a lazily-loaded component. Pair with LazyBoundary to show a spinner
 * while loading and to handle load errors.
 */
export default loader => React.lazy(() => loader);
