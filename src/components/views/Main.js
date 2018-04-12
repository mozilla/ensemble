import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import DashboardContainer from '../containers/DashboardContainer';
import NotFound from './NotFound';
import withTracker from '../decorators/withTracker';
import withNextButton from '../decorators/withNextButton';

import dashboards from '../../config/dashboards.json';


export default () => (
    <main>
        <Switch>
            <Route exact path="/" component={withTracker(withNextButton(Home))} />
            {dashboards.map((dashboardMeta, index) => (
                <Route
                    key={index}
                    path={`/dashboard/${dashboardMeta.path}`}
                    render={props => {
                        const ThisDashboardContainer = () => (
                            <DashboardContainer
                                {...props}
                                source={dashboardMeta.source}
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
