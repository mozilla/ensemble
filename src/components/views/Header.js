import React from 'react';

import './css/Header.css';

import dashboards from '../../config/dashboards.json';


export default () => (
    <header id="main-header">
        <h1><a href="/">Firefox Public Data Report</a></h1>
        <nav id="main-navigation">
            <ul>
                {dashboards.map((dashboard, index) => (
                    <li key={index}>
                        <a href={`/dashboard/${dashboard.path}`}>{dashboard.menuTitle}</a>
                    </li>
                ))}
            </ul>
        </nav>
    </header>
);
