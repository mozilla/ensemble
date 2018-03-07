import React from 'react';
import { Link } from 'react-router-dom';

import './css/Header.css';

import { dashboards } from '../../config/site.json';


export default () => (
    <header id="main-header">
        <h1><Link to="/">Firefox Usage Report</Link></h1>
        <nav id="main-navigation">
            <ul>
                {dashboards.map((dashboard, index) => {
                    return (
                        <li key={index}>
                            <Link to={`/dashboard/${dashboard.path}`}>{dashboard.menuTitle}</Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    </header>
);
