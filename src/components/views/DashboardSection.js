import React from 'react';

import Chart from './Chart';
import ChartDescription from './ChartDescription';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <section className="charts-and-descriptions">
            {props.charts.map((c, index) => (
                <div className="chart-and-description">
                    <Chart
                        key={index}
                        title={c.title}
                        data={c.data}
                        units={c.units}
                        labels={c.labels || {}}
                        scales={c.scales || {}}
                    />
                    <ChartDescription
                        description={c.description}
                    />
                </div>
            ))}
        </section>
    </section>
);
