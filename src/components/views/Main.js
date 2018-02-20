import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import DashboardContainer from '../containers/DashboardContainer';

import dashboards from '../../config/dashboards.json';

import './css/Main.css';

export default () => {
    return (
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
};
