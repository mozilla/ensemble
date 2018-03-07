import React from 'react';

import ChartWrappers from '../viewRouters/ChartWrappers';


export default props => (
    <section id={props.sectionKey} className="dashboard-section">
        <header>
            <h3>{props.title}</h3>
        </header>
        <ChartWrappers
            charts={props.charts}
            activeCategory={props.activeCategory}
            sectionKey={props.sectionKey}
        />
    </section>
);
