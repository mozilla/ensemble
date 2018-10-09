import React from 'react';
import { Link } from 'react-router-dom';

import './css/Header.css';

import dashboards from '../../config/dashboards.json';


export default () => (
    <header id="main-header">
        <h1><Link to="/">Firefox Public Data Report</Link></h1>
        <nav id="main-navigation">
            <ul>
                {dashboards.sections.map(dashboardSection => {
                    if (dashboardSection.comingSoon) {
                        return (
                            <li key={dashboardSection.key} id={`navigation-${dashboardSection.key}`} className="navigation-coming-soon has-subnav">
                                <span className="subnav-title">{dashboardSection.title}</span>
                                <span className="subnav">Coming soon</span>
                            </li>
                        );
                    } else {
                        return (
                            <li key={dashboardSection.key} id={`navigation-${dashboardSection.key}`} className="navigation-group has-subnav">
                                <span className="subnav-title">{dashboardSection.title}</span>
                                <ul className="subnav">
                                    {dashboardSection.members.map(dashboard => (
                                        <li key={dashboardSection.key + dashboard.key}>
                                            <Link to={`/dashboard/${dashboard.key}`}>{dashboard.menuTitle}</Link>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        );
                    }
                })}
                <li><Link to="/contact">Contact</Link></li>
            </ul>
        </nav>
    </header>
);
