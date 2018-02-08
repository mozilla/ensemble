import React from 'react';

import ChartWrappers from './ChartWrappers';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <ChartWrappers charts={props.charts} sectionKey={props.sectionKey} />
    </section>
);
