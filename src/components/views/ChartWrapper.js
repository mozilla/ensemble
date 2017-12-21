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

    return (
        <div className={`${props.identifier} chart-wrapper`}>
            <ChartContainer
                legendTarget={`.${props.identifier} .legend`}
                title={props.title}
                populations={props.populations}
                units={props.units || {}}
                labels={props.labels || {}}
                scales={props.scales || {}}
            />
            <div className="legend" />
            {maybeChartDescription}
        </div>
    );
};
