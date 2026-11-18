import React from 'react';

import Spinner from '../components/views/Spinner';
import ErrorComponent from '../components/views/Error';


/**
 * Wraps children containing a lazyLoad'd component with a loading spinner and
 * a fallback for chunk-load failures, which offers a reload because only a
 * reload loads the code again. React.lazy/Suspense only handles the
 * loading case; catching the error case requires an error boundary class
 * component, which is why this can't be a function component.
 */
export default class LazyBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <>
                    <ErrorComponent
                        title="Error"
                        message="Load error"
                        pageHeading={this.props.pageHeading}
                    />
                    <button type="button" onClick={() => window.location.reload()}>
                        Reload the page
                    </button>
                </>
            );
        }

        return (
            <React.Suspense fallback={<Spinner label={this.props.loadingLabel} />}>
                {this.props.children}
            </React.Suspense>
        );
    }
}
