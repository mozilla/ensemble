import React from 'react';

import MetricWrappers from './MetricWrappers';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <MetricWrappers
            metrics={props.metrics}
            activeCategory={props.activeCategory}
            sectionKey={props.sectionKey}
        />
    </section>
);
