import React from 'react';
import { Switch, Route } from 'react-router-dom';

import withTracker from '../decorators/withTracker';
import withNextButton from '../decorators/withNextButton';
import lazyLoad from '../../lib/lazyLoad';

import { dashboards } from '../../config.json';


export default () => {
    const Home = lazyLoad(import('./Home'));
    const Contact = lazyLoad(import('./Contact'));
    const DashboardContainer = lazyLoad(import('../containers/DashboardContainer'));
    const NotFound = lazyLoad(import('./NotFound'));

    return (
        <main>
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
        </main>
    );
};
