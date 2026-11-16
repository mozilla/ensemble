import React from 'react';
import markdownIt from 'markdown-it';
import markdownItSup from 'markdown-it-sup';
import memoizeOne from 'memoize-one';

import lazyLoad from '../../lib/lazyLoad';
import LazyBoundary from '../../lib/LazyBoundary';
import StripedHeader from './StripedHeader';

import './css/MetricOverview.css';


const ChartContainer = lazyLoad(() => import('../containers/ChartContainer'));
const CustomizableDateContainer = lazyLoad(() => import('../containers/CustomizableDateContainer'));
const DataTableContainer = lazyLoad(() => import('../containers/DataTableContainer'));

class MetricOverview extends React.Component {
    constructor(props) {
        super(props);

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
                props.description
            );
        }

        let MetricContainer = null;
        if (props.type === 'line') {
            const numPopulations = Object.keys(props.data.populations).length;
            MetricContainer = (
                <ChartContainer
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
                <CustomizableDateContainer
                    dates={Object.keys(props.data.dates).sort().reverse()}
                    metric={true}>
                    <DataTableContainer
                        data={props.data}
                        columns={props.columns}
                    />
                </CustomizableDateContainer>
            );
        }

        return (
            <div id={props.identifier} className="metric-overview">
                <StripedHeader tag={props.inSection ? 'h5' : 'h4'} label={props.title} />
                {maybeMetricDescription}
                <div className="metric-and-legend">
                    <LazyBoundary>
                        {MetricContainer}
                    </LazyBoundary>
                </div>
            </div>
        );
    }
}

export default MetricOverview;
