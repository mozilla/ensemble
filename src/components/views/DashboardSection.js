import React from 'react';

import MetricOverviewCollection from './MetricOverviewCollection';

import './css/DashboardSection.css';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h4 className="dashboard-section-title contrasted">{props.title}</h4>
        </header>
        <MetricOverviewCollection
            metrics={props.metrics}
            activeRegion={props.activeRegion}
            sectionKey={props.sectionKey}
            dashboardSource={props.dashboardSource}
            inSection={true}
        />
    </section>
);
