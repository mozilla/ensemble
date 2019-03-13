import React from 'react';
import { connect } from 'react-refetch';

import ErrorComponent from '../views/Error';
import MetricOverview from '../views/MetricOverview';


class MetricOverviewContainer extends React.Component {
    // If the data is changing, only re-render once the new data is received.
    // Don't show a spinner while new data is being loaded, as that would cause
    // the scrollbar to move.
    //
    // We do want the spinner to be shown on the initial render, but we don't
    // need to do anything special here to handle that case because
    // shouldComponentUpdate is not run for the initial render.
    shouldComponentUpdate(nextProps) {
        return nextProps.dataFetch.fulfilled;
    }

    render() {
        const props = this.props;
        const dataFetch = props.dataFetch;

        if (dataFetch.pending) {

            // Metric data loads quickly, even over a bad connection. The
            // ChartContainer component, however, is loaded next and can take
            // several seconds to load over a bad connection.
            //
            // If we show both spinners, they should look the same. They should
            // be positioned almost identically so that the user doesn't notice
            // a difference when the second spinner replaces the first. That can
            // be a little tricky. We also don't test against slow connections
            // all that often, so that styling is prone to break over time as
            // other changes are made.
            //
            // An easier solution is to not show this Spinner, since it's the
            // shorter of the two, and show the ChartContainer spinner as
            // normal.

            return null;
        } else if (dataFetch.rejected) {
            if (dataFetch.reason && dataFetch.reason.message) {
                // eslint-disable-next-line no-console
                console.error(dataFetch.reason.message);
            }

            return (
                <ErrorComponent
                    id="metric-overview-fetch-error"
                    title="Error fetching metric"
                />
            );
        } else if (dataFetch.fulfilled) {
            return (
                <MetricOverview
                    identifier={props.identifier}
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    type={dataFetch.value.type}
                    axes={dataFetch.value.axes || {}}
                    columns={dataFetch.value.columns}
                    data={dataFetch.value.data}
                    annotations={dataFetch.value.annotations}
                    inSection={props.inSection}
                />
            );
        }
    }
}

export default connect(props => ({
    dataFetch: { url: `${props.dashboardSource}/${props.activeRegion}/${props.slug}` },
}))(MetricOverviewContainer);
