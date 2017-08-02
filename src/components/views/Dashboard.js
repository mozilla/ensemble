import React from 'react';

import DashboardSection from './DashboardSection';

import './css/Dashboard.css';


export default props => (
    <section id="dashboard">
        <h2>{props.title}</h2>
        <p className="description">{props.description}</p>

        <section id="chart-groups">
            {props.sections.map((s, index) => (
                <DashboardSection
                    key={index}

                    sectionKey={s.key}
                    title={s.title}
                    charts={props.charts.filter(c => c.section === s.key)}
                />
            ))}
        </section>
    </section>
);
