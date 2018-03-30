import React from 'react';

import MetricOverviewCollection from './MetricOverviewCollection';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3 className="dashboard-section-title">{props.title}</h3>
        </header>
        <MetricOverviewCollection
            metrics={props.metrics}
            activeCategory={props.activeCategory}
            sectionKey={props.sectionKey}
        />
    </section>
);
