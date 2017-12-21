import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import DashboardContainer from '../containers/DashboardContainer';

import './css/Main.css';


const dashboards = [
    {
        subdirectory: 'hardware',
        dataURL: '//ensemble-transposer.herokuapp.com/firefox-hardware-report',
    },
];

export default () => (
    <main>
        <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/dashboard/:key"
                   render={props => (
                       <DashboardContainer
                           {...props}
                           dataURL={dashboards.find(d => d.subdirectory === props.match.params.key).dataURL}
                       />
                   )}
            />
        </Switch>
    </main>
);
