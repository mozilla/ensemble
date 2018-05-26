import React from 'react';
import markdownIt from 'markdown-it';

import lazyLoad from '../../lib/lazyLoad';
import StripedHeader from './StripedHeader';

import './css/MetricOverview.css';


class MetricOverview extends React.Component {
    // Create a markdown parser that only parses links. It needs to be static
    // for static methods to use it.
    static markdownParser = markdownIt('zero').enable('link');

    constructor(props) {
        super(props);

        // Lazy-load the proper components
        if (props.type === 'line') {
            this.ChartContainer = lazyLoad(import('../containers/ChartContainer'));
        } else if (props.type === 'table') {
            this.CustomizableDateContainer = lazyLoad(import('../containers/CustomizableDateContainer'));
            this.DataTableContainer = lazyLoad(import('../containers/DataTableContainer'));
        }

        this.state = { maybeMetricDescription: null };
    }

    static getDerivedStateFromProps(props, state) {
        const newState = {};

        // Only build the description component if props.description is non-null
        // and the description component hasn't been built yet.
        //
        // Only re-build the description component if props.description is
        // non-null and has changed.
        if (props.description && (!state.description || props.description !== state.description)) {
            newState.description = props.description;

            const multipleParagraphs = Array.isArray(props.description);

            if (multipleParagraphs) {
                newState.maybeMetricDescription = (
                    <div className="metric-description">
                        {props.description.map((paragraph, index) => (
                            <p key={index} dangerouslySetInnerHTML={
                                {__html: MetricOverview.markdownParser.renderInline(paragraph)}
                            } />
                        ))}
                    </div>
                );
            } else {
                newState.maybeMetricDescription = (
                    <p className="metric-description" dangerouslySetInnerHTML={
                        {__html: MetricOverview.markdownParser.renderInline(props.description)}
                    } />
                );
            }
        }

        if (Object.keys(newState).length > 0) return newState;
        return null;
    }

    render() {
        const props = this.props;

        let MetricContainer = null;
        if (props.type === 'line') {
            const numPopulations = Object.keys(props.data[props.activeCategory].populations).length;
            MetricContainer = (
                <this.ChartContainer
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
            // We're omitting titleComponent here since the title is set in a previous sibling.
            MetricContainer = (
                <this.CustomizableDateContainer
                    dates={Object.keys(props.data[props.activeCategory].dates)}
                    metric={true}>
                    <this.DataTableContainer
                        data={props.data}
                        activeCategory={props.activeCategory}
                        columns={props.columns || {}}
                    />
                </this.CustomizableDateContainer>
            );
        }

        return (
            <div id={props.identifier} className="metric-overview">
                <StripedHeader tag="h5" label={props.title} />
                {this.state.maybeMetricDescription}
                <div className="metric-and-legend">
                    {MetricContainer}
                    <div className="legend" />
                </div>
            </div>
        );
    }
}

export default MetricOverview;
