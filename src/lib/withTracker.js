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
        componentDidMount() {
            const page = this.props.location.pathname;
            trackPage(page);
        }

        componentWillReceiveProps(nextProps) {
            const currentPage = this.props.location.pathname;
            const nextPage = nextProps.location.pathname;

            if (currentPage !== nextPage) {
                trackPage(nextPage);
            }
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    };

    return HOC;
};
