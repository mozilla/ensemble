import React from 'react';

import MetricOverviewContainer from '../containers/MetricOverviewContainer';


export default props => (
    <section className="metric-overview-collection">
        {props.metrics.map((metricSlug, index) => {
            let identifier = '';
            if (props.sectionKey) {
                identifier = `${props.sectionKey}-metric-overview-${index + 1}`;
            } else {
                identifier = `metric-overview-${index + 1}`;
            }

            return (
                <MetricOverviewContainer
                    key={identifier}
                    slug={metricSlug}
                    identifier={identifier}
                    dashboardSource={props.dashboardSource}
                    activeCategory={props.activeCategory}
                />
            );
        })}
    </section>
);
