import React from 'react';
import markdownIt from 'markdown-it';

import lazyLoad from '../../lib/lazyLoad';
import StripedHeader from './StripedHeader';

import './css/MetricOverview.css';


export default props => {
    // Create a markdown parser that only parses links
    const markdownParser = markdownIt('zero').enable('link');

    let maybeMetricDescription = null;
    if (props.description) {
        const multipleParagraphs = Array.isArray(props.description);
        if (multipleParagraphs) {
            maybeMetricDescription = (
                <div className="metric-description">
                    {props.description.map((paragraph, index) => (
                        <p key={index} dangerouslySetInnerHTML={
                            {__html: markdownParser.renderInline(paragraph)}
                        } />
                    ))}
                </div>
            );
        } else {
            maybeMetricDescription = (
                <p className="metric-description" dangerouslySetInnerHTML={
                    {__html: markdownParser.renderInline(props.description)}
                } />
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

        // We're omitting titleComponent here since the title is set in a previous sibling.
        MetricContainer = (
            <CustomizableDateContainer
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
            <StripedHeader tag="h5" label={props.title} />
            {maybeMetricDescription}
            <div className="metric-and-legend">
                {MetricContainer}
                <div className="legend" />
            </div>
        </div>
    );
};
