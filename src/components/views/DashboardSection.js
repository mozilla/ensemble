import React from 'react';

import Chart from './Chart';

import './css/DashboardSection.css';


export default props => (
    <section id={props.sectionKey} className="chart-group">
        <h3>{props.title}</h3>
        <section className="charts">
            {props.charts.map((c, index) => (
                <Chart
                    key={index}
                    title={c.title}
                    data={c.data}
                    units={c.units}
                    labels={c.labels || {}}
                    scales={c.scales || {}}
                />
            ))}
        </section>
    </section>
);
