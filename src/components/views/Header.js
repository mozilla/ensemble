import React from 'react';
import { Link } from 'react-router-dom';

import './css/Header.css';

import { dashboards } from '../../config.json';


export default () => (
    <header id="main-header">
        <h1><Link to="/">Firefox Public Data Report</Link></h1>
        <nav id="main-navigation">
            <ul>
                {dashboards.map(dashboard => (
                    <li key={dashboard.key}>
                        <Link to={`/dashboard/${dashboard.key}`}>{dashboard.menuTitle}</Link>
                    </li>
                ))}
                <li><Link to="/contact">Contact</Link></li>
            </ul>
        </nav>
    </header>
);
