import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import DashboardContainer from '../containers/DashboardContainer';

import dashboards from '../../config/dashboards.json';


export default () => {
    function renderDashboardContainer(props, dashboardMeta) {
        return <DashboardContainer {...props} source={dashboardMeta.source} />;
    }

    return (
        <main>
            <Switch>
                <Route exact path="/" component={Home} />
                {dashboards.map((dashboardMeta, index) => (
                    <Route
                        key={index}
                        path={`/dashboard/${dashboardMeta.path}`}
                        render={props => renderDashboardContainer(props, dashboardMeta)}
                    />
                ))}
            </Switch>
        </main>
    );
};
