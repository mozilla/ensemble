import React from 'react';

import ChartContainer from '../containers/ChartContainer';
import CustomizableDateMetricContainer from '../containers/CustomizableDateMetricContainer';
import DataTableContainer from '../containers/DataTableContainer';
import MetricDescription from './MetricDescription';

import './css/MetricWrapper.css';


export default props => {
    let maybeMetricDescription = null;
    if (props.description) {
        maybeMetricDescription = (
            <MetricDescription
                description={props.description}
            />
        );
    }

    let MetricContainer = null;
    let numPopulations = null;
    if (props.type === 'line') {
        numPopulations = Object.keys(props.categories[props.activeCategory].populations).length;
        MetricContainer = (
            <ChartContainer
                legendTarget={`.${props.identifier} .legend`}
                title={props.title}
                categories={props.categories}
                activeCategory={props.activeCategory}
                axes={props.axes || {}}
            />
        );
    } else if (props.type === 'table') {
        MetricContainer = (
            <CustomizableDateMetricContainer
                title={props.title}
                categories={props.categories}
                activeCategory={props.activeCategory}>
                <DataTableContainer
                    columns={props.columns || {}}
                />
            </CustomizableDateMetricContainer>
        );
    }

    // The data-populations thing is a workaround for metrics-graphics issue
    // #806. See the comment in PopulationColors.css for more information.
    return (
        <div id={props.identifier} className="metric-wrapper" data-populations={numPopulations}>
            <div className="metric-and-legend">
                {MetricContainer}
                <div className="legend" />
            </div>
            {maybeMetricDescription}
        </div>
    );
};
