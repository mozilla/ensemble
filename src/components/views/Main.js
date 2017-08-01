import React from 'react';
import { Switch, Route } from 'react-router-dom';

import Home from './Home';
import Dashboard from './Dashboard';


const dataURLs = {
    example: '/example.json',
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
                       <Dashboard {...props} dataURL={lookupDataURL(props.match.params.key)} />
                   )}
            />
        </Switch>
    </main>
);
