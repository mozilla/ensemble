import React from 'react';

import ChartContainer from '../containers/ChartContainer';
import CustomizableDateMetricContainer from '../containers/CustomizableDateMetricContainer';
import DataTableContainer from '../containers/DataTableContainer';

import './css/MetricOverview.css';


export default props => {
    let maybeMetricDescription = null;
    if (props.description) {
        const multipleParagraphs = Array.isArray(props.description);
        if (multipleParagraphs) {
            maybeMetricDescription = (
                <div className="metric-description">
                    {props.description.map(paragraph => <p>{paragraph}</p>)}
                </div>
            );
        } else {
            maybeMetricDescription = (
                <p className="metric-description">
                    {props.description}
                </p>
            );
        }
    }

    let MetricContainer = null;
    let numPopulations;
    if (props.type === 'line') {
        numPopulations = Object.keys(props.categories[props.activeCategory].populations).length;
        MetricContainer = (
            <ChartContainer
                legendTarget={`#${props.identifier} .legend`}
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
        <div id={props.identifier} className="metric-overview" data-populations={numPopulations}>
            <div className="metric-and-legend">
                {MetricContainer}
                <div className="legend" />
            </div>
            {maybeMetricDescription}
        </div>
    );
};
