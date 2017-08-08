import React from 'react';
import { Link } from 'react-router-dom';

export default () => (
    <header id="main-header">
        <h1><Link to="/">Ensemble</Link></h1>
        <p id="data-warning">This is an example. These dashboards do not display any real data.</p>
    </header>
);
