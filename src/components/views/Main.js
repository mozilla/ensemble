import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import DashboardContainer from '../containers/DashboardContainer';

import './css/Main.css';


const dataURLs = {
    hardware: process.env.PUBLIC_URL + '/dashboards/hardware/data.json',
    crashes: process.env.PUBLIC_URL + '/dashboards/crashes/data.json',
};

function lookupDataURL(key) {
    return dataURLs[key];
}

export default () => (
    <main>
        <Switch>
            <Route exact path="/" component={Home} />
            <Route path="/dashboard/:key"
                   render={(props) => (
                       <DashboardContainer {...props} dataURL={lookupDataURL(props.match.params.key)} />
                   )}
            />
        </Switch>
    </main>
);
