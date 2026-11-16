import React from 'react';
import withFetch from '../../lib/withFetch';

import ErrorComponent from '../views/Error';
import MetricOverview from '../views/MetricOverview';
import MetricOverviewPlaceholder from '../views/MetricOverviewPlaceholder';


class MetricOverviewContainer extends React.Component {
    // If the data is changing, only re-render once the request settles, with
    // either the new data or an error, so that the chart already shown keeps
    // its place instead of giving way to a placeholder.
    //
    // shouldComponentUpdate is not run for the initial render, so the
    // placeholder still shows while the first data loads.
    shouldComponentUpdate(nextProps) {
        return nextProps.dataFetch.fulfilled || nextProps.dataFetch.rejected;
    }

    render() {
        const props = this.props;
        const dataFetch = props.dataFetch;

        if (dataFetch.pending) {
            return <MetricOverviewPlaceholder inSection={props.inSection} />;
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

export default withFetch(props => `${props.dashboardSource}/${props.activeRegion}/${props.slug}/index.json`)(MetricOverviewContainer);
