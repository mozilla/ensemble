import React from 'react';

import ChartWrapper from './ChartWrapper';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <section className="chart-wrappers">
            {props.charts.map((chartMeta, index) => {
                const identifier = `${props.sectionKey}-chart-wrapper-${index + 1}`;

                return (
                    <ChartWrapper
                        {...chartMeta}
                        key={index}
                        identifier={identifier}
                    />
                );
            })}
        </section>
    </section>
);
