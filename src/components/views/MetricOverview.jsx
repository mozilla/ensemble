import React from 'react';
import markdownIt from 'markdown-it';
import markdownItSup from 'markdown-it-sup';
import memoizeOne from 'memoize-one';

import lazyLoad from '../../lib/lazyLoad';
import StripedHeader from './StripedHeader';

import './css/MetricOverview.css';


class MetricOverview extends React.Component {
    constructor(props) {
        super(props);

        // Lazy-load the proper components
        if (props.type === 'line') {
            this.ChartContainer = lazyLoad(import('../containers/ChartContainer'));
        } else if (props.type === 'table') {
            this.CustomizableDateContainer = lazyLoad(import('../containers/CustomizableDateContainer'));
            this.DataTableContainer = lazyLoad(import('../containers/DataTableContainer'));
        }

        this.markdownParser = markdownIt('zero').use(markdownItSup)
                                                .enable(['link', 'entity']);
    }

    memoizeMetricDescription = memoizeOne(description => {
        const multipleParagraphs = Array.isArray(description);

        let descriptionMarkup;
        if (multipleParagraphs) {
            descriptionMarkup = description.map((paragraph, index) => (
                <p key={index} dangerouslySetInnerHTML={
                    {__html: this.markdownParser.renderInline(paragraph)}
                } />
            ));
        } else {
            descriptionMarkup = (
                <p dangerouslySetInnerHTML={
                    {__html: this.markdownParser.renderInline(description)}
                } />
            );
        }

        return (
            <div className="metric-description">
                {descriptionMarkup}
            </div>
        );
    });

    render() {
        const props = this.props;

        let maybeMetricDescription;
        if (props.description) {
            maybeMetricDescription = this.memoizeMetricDescription(
                props.description,
            );
        }

        let MetricContainer = null;
        if (props.type === 'line') {
            const numPopulations = Object.keys(props.data.populations).length;
            MetricContainer = (
                <this.ChartContainer
                    legendTarget={`#${props.identifier} .legend`}
                    title={props.title}
                    data={props.data}
                    axes={props.axes}
                    annotations={props.annotations}
                    numPopulations={numPopulations}
                />
            );
        } else if (props.type === 'table') {
            // We're omitting titleComponent here since the title is set in a previous sibling.
            MetricContainer = (
                <this.CustomizableDateContainer
                    dates={Object.keys(props.data.dates).sort().reverse()}
                    metric={true}>
                    <this.DataTableContainer
                        data={props.data}
                        columns={props.columns}
                    />
                </this.CustomizableDateContainer>
            );
        }

        return (
            <div id={props.identifier} className="metric-overview">
                <StripedHeader tag={props.inSection ? 'h5' : 'h4'} label={props.title} />
                {maybeMetricDescription}
                <div className="metric-and-legend">
                    {MetricContainer}
                    <div className="legend" />
                </div>
            </div>
        );
    }
}

export default MetricOverview;
