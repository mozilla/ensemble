import React from 'react';

import DashboardSection from './DashboardSection';

import './css/Dashboard.css';


export default props => (
    <article id="dashboard">
        <header>
            <h2>{props.title}</h2>
            <p id="dashboard-description">{props.description}</p>
        </header>

        <section id="dashboard-sections">
            {props.sections.map((s, index) => (
                <DashboardSection
                    key={index}

                    sectionKey={s.key}
                    title={s.title}
                    charts={props.charts.filter(c => c.section === s.key)}
                />
            ))}
        </section>
    </article>
);
