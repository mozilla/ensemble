import React from 'react';
import { connect } from 'react-refetch';

import SummaryMetric from '../views/SummaryMetric';
import ErrorComponent from '../views/Error';


class SummaryMetricContainer extends React.Component {
    formatData = rawData => {
        const formattedData = [];
        const populations = Object.keys(rawData.populations);

        // True/False charts
        if (populations.length === 1) {
            const onlyPopulation = rawData.populations[populations[0]];
            const trueValue = onlyPopulation.find(dp => dp.x === this.props.activeDate).y;

            formattedData.push({
                id: 0,
                name: "True",
                value: trueValue,
            });

            formattedData.push({
                id: 1,
                name: "False",
                value: 100 - trueValue,
            });
        }

        // Multi-population charts
        else {
            const otherThreshold = 5;
            let otherValue = 0;

            let index = 0;
            populations.forEach(populationName => {
                const activeDataPoint = rawData.populations[populationName].find(dp => dp.x === this.props.activeDate);

                // There is not guaranteed to be a data point for the active
                // date
                if (!activeDataPoint) return;

                const value = activeDataPoint.y;

                // If a population has >= otherThreshold representation, it
                // should have its own section of the chart.
                if (value >= otherThreshold) {
                    formattedData.push({
                        id: index,
                        name: populationName,
                        value,
                    });
                }

                // Otherwise, if a chart has < otherThreshold representation, it
                // should be grouped into an "Other" region.
                else {
                    otherValue += value;
                }

                index++;
            });

            if (otherValue > 0) {
                formattedData.push({
                    id: index,
                    name: 'Other',
                    value: otherValue,
                });
            }
        }

        // Reverse-sort by value so that the biggest population appears first in
        // the summary metric. "Other" always appears last.
        formattedData.sort((a, b) => {
            if (a.name === 'Other') return 1;
            if (b.name === 'Other') return -1;
            return b.value - a.value;
        });

        return formattedData;
    }

    render() {
        const dataFetch = this.props.dataFetch;

        if (dataFetch.pending) {
            // Don't show a spinner for the same reason we don't show a spinner
            // when metric data is loading. See MetricOverviewContainer.js.
            return null;
        } else if (dataFetch.rejected) {
            const extraErrorComponentProps = {};

            if (dataFetch.reason && dataFetch.reason.message) {
                extraErrorComponentProps.message = dataFetch.reason.message;
            }

            return (
                <ErrorComponent
                    id="summary-metric-fetch-error"
                    title="Error fetching summary metric"
                    {...extraErrorComponentProps}
                />
            );
        } else if (dataFetch.fulfilled) {
            return (
                <SummaryMetric
                    title={dataFetch.value.title}
                    data={this.formatData(dataFetch.value.data)}
                />
            );
        }
    }
}

export default connect(props => ({
    dataFetch: { url: `${props.dashboardSource}/${props.activeRegion}/${props.slug}` },
}))(SummaryMetricContainer);
