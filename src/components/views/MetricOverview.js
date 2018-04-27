import React from 'react';

import lazyLoad from '../../lib/lazyLoad';

import './css/MetricOverview.css';


export default props => {
    let maybeMetricDescription = null;
    if (props.description) {
        const multipleParagraphs = Array.isArray(props.description);
        if (multipleParagraphs) {
            maybeMetricDescription = (
                <div className="metric-description">
                    {props.description.map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
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
    if (props.type === 'line') {
        const ChartContainer = lazyLoad(import('../containers/ChartContainer'));
        const numPopulations = Object.keys(props.data[props.activeCategory].populations).length;
        MetricContainer = (
            <ChartContainer
                legendTarget={`#${props.identifier} .legend`}
                title={props.title}
                data={props.data}
                activeCategory={props.activeCategory}
                axes={props.axes || {}}
                annotations={props.annotations || {}}
                numPopulations={numPopulations}
            />
        );
    } else if (props.type === 'table') {
        const CustomizableDateContainer = lazyLoad(import('../containers/CustomizableDateContainer'));
        const DataTableContainer = lazyLoad(import('../containers/DataTableContainer'));

        const titleComponent = <h5 className="metric-title">{props.title}</h5>;
        MetricContainer = (
            <CustomizableDateContainer
                titleComponent={titleComponent}
                dates={Object.keys(props.data[props.activeCategory].dates)}
                metric={true}>
                <DataTableContainer
                    data={props.data}
                    activeCategory={props.activeCategory}
                    columns={props.columns || {}}
                />
            </CustomizableDateContainer>
        );
    }

    return (
        <div id={props.identifier} className="metric-overview">
            <h5 className="metric-title">{props.title}</h5>
            {maybeMetricDescription}
            <div className="metric-and-legend">
                {MetricContainer}
                <div className="legend" />
            </div>
        </div>
    );
};
