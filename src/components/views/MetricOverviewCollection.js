import React from 'react';

import MetricOverview from './MetricOverview';


export default props => (
    <section className="metric-overview-collection">
        {props.metrics.map((metricMeta, index) => {
            let identifier = '';
            if (props.sectionKey) {
                identifier = `${props.sectionKey}-metric-overview-${index + 1}`;
            } else {
                identifier = `metric-overview-${index + 1}`;
            }

            return (
                <MetricOverview
                    {...metricMeta}
                    key={index}
                    identifier={identifier}
                    activeCategory={props.activeCategory}
                />
            );
        })}
    </section>
);
