import React from 'react';
import reactGA from 'react-ga';


// This approach is recommended by react-ga
// https://github.com/react-ga/react-ga/wiki/React-Router-v4-withTracker

reactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);

export default (WrappedComponent, options = {}) => {
    const trackPage = page => {
        reactGA.set({
            page,
            ...options,
        });
        reactGA.pageview(page);
    };

    const HOC = class extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                page: props.location.pathname,
            };
        }

        componentDidMount() {
            trackPage(this.state.page);
        }

        static getDerivedStateFromProps(nextProps, prevState) {
            const nextPage = nextProps.location.pathname;

            if (nextPage !== prevState.page) {
                trackPage(nextPage);
                return {
                    page: nextPage,
                };
            }

            return null;
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    };

    return HOC;
};
