import React from 'react';

import Chart from './Chart';


export default props => (
    <section id="dashboard">
        <h2>{props.title}</h2>
        <p className="description">{props.description}</p>

        {props.sections.map(s => (
            <section id={s.key}>
                <h3>{s.title}</h3>
                {props.charts.filter(c => c.section === s.key).map(c => (
                    <Chart title={c.title} data={c.data} />
                ))}
            </section>
        ))}
    </section>
);
