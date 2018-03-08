import React from 'react';

import MetricWrapper from './MetricWrapper';


export default props => (
    <section className="metric-wrappers">
        {props.metrics.map((metricMeta, index) => {
            let identifier = '';
            if (props.sectionKey) {
                identifier = `${props.sectionKey}-metric-wrapper-${index + 1}`;
            } else {
                identifier = `metric-wrapper-${index + 1}`;
            }

            return (
                <MetricWrapper
                    {...metricMeta}
                    key={index}
                    identifier={identifier}
                    activeCategory={props.activeCategory}
                />
            );
        })}
    </section>
);
