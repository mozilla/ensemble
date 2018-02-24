import React from 'react';

import ChartWrapper from './ChartWrapper';


export default props => (
    <section className="chart-wrappers">
        {props.charts.map((chartMeta, index) => {
            let identifier = '';
            if (props.sectionKey) {
                identifier = `${props.sectionKey}-chart-wrapper-${index + 1}`;
            } else {
                identifier = `chart-wrapper-${index + 1}`;
            }

            return (
                <ChartWrapper
                    {...chartMeta}
                    key={index}
                    identifier={identifier}
                    activeCategory={props.activeCategory}
                />
            );
        })}
    </section>
);
