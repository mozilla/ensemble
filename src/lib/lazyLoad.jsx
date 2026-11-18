import React from 'react';


/**
 * Start loading a component's code now and return a component that renders it.
 * Pair with LazyBoundary to show a spinner while loading and to handle load
 * errors.
 *
 * Once the code has loaded, the component renders it straight away. A new
 * React.lazy suspends on its first render even when its code is already
 * loaded, which would flash the spinner on every visit.
 *
 * A failed load stays failed until the page is reloaded. Browsers can keep a
 * failed import() too, so loading again isn't a reliable retry.
 */
export default loader => {
    let loadedComponent = null;
    const loading = loader().then(loadedModule => {
        loadedComponent = loadedModule.default;
        return loadedModule;
    });
    // Nothing may ever render this component, so its failure must not go
    // unhandled. React.lazy still sees the rejection.
    loading.catch(() => {});
    const LazyComponent = React.lazy(() => loading);

    return props => {
        const Component = loadedComponent || LazyComponent;
        return <Component {...props} />;
    };
};
