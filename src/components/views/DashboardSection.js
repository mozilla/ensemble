import React from 'react';

import ChartContainer from '../containers/ChartContainer';
import ChartDescription from './ChartDescription';

import './css/ChartWrapper.css';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <section className="chart-wrappers">
            {props.charts.map((c, index) => {
                const identifier = `${props.sectionKey}-chart-wrapper-${index + 1}`;
                return (
                    <div key={index} className={`${identifier} chart-wrapper`}>
                        <ChartContainer
                            legendTarget={`.${identifier} .legend`}
                            title={c.title}
                            populations={c.populations}
                            units={c.units || {}}
                            labels={c.labels || {}}
                            scales={c.scales || {}}
                        />
                        <div className="legend" />
                        <ChartDescription
                            description={c.description}
                        />
                    </div>
                );
            })}
        </section>
    </section>
);
