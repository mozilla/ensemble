import React from 'react';
import { Link } from 'react-router-dom';

import './css/Header.css';


export default () => (
    <header id="main-header">
        <h1><Link to="/">Firefox Usage Report</Link></h1>
        <nav id="main-navigation">
            <ul>
                <li><Link to="/dashboard/usage">Usage</Link></li>
                <li><Link to="/dashboard/hardware">Hardware</Link></li>
            </ul>
        </nav>
    </header>
);
