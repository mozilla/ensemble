import querystring from 'querystring';

import React from 'react';
import { Link } from 'react-router-dom';

import './css/Header.css';
import dashboards from '../../config/dashboards.json';


export default props => (
    <header id="main-header">
        <h1><Link to="/">Firefox Public Data Report</Link></h1>
        <nav id="main-navigation">
            <ul>
                {dashboards.sections.map(dashboardSection => {
                    if (dashboardSection.comingSoon) {
                        return (
                            <li key={dashboardSection.key} id={`navigation-${dashboardSection.key}`} className="navigation-coming-soon">
                                <span className="navigation-section-title">{dashboardSection.title}</span>
                                <span className="navigation-coming-soon-message">Coming soon</span>
                            </li>
                        );
                    } else {
                        return (
                            <li key={dashboardSection.key} id={`navigation-${dashboardSection.key}`} className="navigation-section">
                                <span className="navigation-section-title">{dashboardSection.title}</span>
                                <ul className="navigation-section-members">
                                    {dashboardSection.members.map(dashboard => {
                                        let linkURL = `/dashboard/${dashboard.key}`;

                                        if (props.preferredRegion && !props.regionlessDashboards.includes(dashboard.key)) {
                                            const qp = querystring.parse(window.location.search.substring(1));
                                            qp.region = props.preferredRegion;
                                            linkURL += '?' + querystring.stringify(qp);
                                        }

                                        return (
                                            <li key={dashboardSection.key + dashboard.key}>
                                                <Link to={linkURL}>{dashboard.menuTitle}</Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        );
                    }
                })}
            </ul>
        </nav>
    </header>
);
