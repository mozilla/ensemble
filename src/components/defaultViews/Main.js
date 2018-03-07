import React from 'react';
import { Switch, Route } from 'react-router-dom';

import DashboardContainer from '../containers/DashboardContainer';
import Home from '../viewRouters/Home.js';

import { dashboards } from '../../config/site.json';


export default () => (
    <main>
        <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/dashboard/:key"
                   render={props => (
                       <DashboardContainer
                           {...props}
                           source={dashboards.find(d => d.path === props.match.params.key).source}
                       />
                   )}
            />
        </Switch>
    </main>
);
