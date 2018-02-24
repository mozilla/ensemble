import React from 'react';

import ChartContainer from '../containers/ChartContainer';
import ChartDescription from './ChartDescription';

import './css/ChartWrapper.css';


export default props => {
    let maybeChartDescription = null;
    if (props.description) {
        maybeChartDescription = (
            <ChartDescription
                description={props.description}
            />
        );
    }

    // The data-populations thing is a workaround for metrics-graphics issue
    // #806. See the comment in PopulationColors.css for more information.
    return (
        <div className={`${props.identifier} chart-wrapper`} data-populations={Object.keys(props.categories[props.activeCategory].populations).length}>
            <div className="chart-and-legend">
                <ChartContainer
                    legendTarget={`.${props.identifier} .legend`}
                    title={props.title}
                    categories={props.categories}
                    activeCategory={props.activeCategory}
                    units={props.units || {}}
                    labels={props.labels || {}}
                    scales={props.scales || {}}
                />
                <div className="legend" />
            </div>
            {maybeChartDescription}
        </div>
    );
};
