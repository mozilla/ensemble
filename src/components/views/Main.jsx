import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';

import withTracker from '../decorators/withTracker';
import withNextButton from '../decorators/withNextButton';
import lazyLoad from '../../lib/lazyLoad';
import LazyBoundary from '../../lib/LazyBoundary';

import { dashboards } from '../../config.json';


const Main = mainProps => {
    const Home = lazyLoad(import('./Home'));
    const Contact = lazyLoad(import('./Contact'));
    const DashboardContainer = lazyLoad(import('../containers/DashboardContainer'));
    const NotFound = lazyLoad(import('./NotFound'));

    return (
        <main>
            {/* Keyed on the route so a failed chunk load doesn't brick every
                later navigation - the key change fully remounts the
                boundary, resetting its error state, instead of leaving
                "Load error" in place until a full page reload. */}
            <LazyBoundary key={mainProps.location.pathname}>
                <Switch>
                    <Route exact path="/" component={withTracker(withNextButton(Home))} />
                    <Route exact path="/contact" component={withTracker(Contact)} />
                    {dashboards.map(dashboard => (
                        <Route
                            key={dashboard.key}
                            exact path={`/dashboard/${dashboard.key}`}
                            render={props => {
                                const ThisDashboardContainer = () => (
                                    <DashboardContainer
                                        {...props}
                                        source={dashboard.source}
                                    />
                                );
                                const Component = withTracker(withNextButton(ThisDashboardContainer));

                                return <Component {...props} />;
                            }}
                        />
                    ))}
                    <Route component={withTracker(withNextButton(NotFound))} />
                </Switch>
            </LazyBoundary>
        </main>
    );
};

export default withRouter(Main);
