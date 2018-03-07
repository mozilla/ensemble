import React from 'react';

import Chart from '../viewRouters/Chart';


export default class extends React.Component {
    formatData(populations) {
        const data = [];
        const legend = [];

        for (const populationName in populations) {
            legend.push(populationName);

            // Don't show a data point if the y value is null. Active user
            // metrics (YAU, MAU, etc.) have null y values for most dates.
            const dataToShow = populations[populationName].filter(pd => pd.y !== null);

            data.push(dataToShow.map(pd => {
                return {
                    x: Date.parse(pd.x) ? new Date(pd.x) : pd.x,
                    y: pd.y,
                };
            }));
        };

        return { data, legend };
    }

    render() {
        const formatted = this.formatData(this.props.categories[this.props.activeCategory].populations);
        const showLegend = Object.keys(this.props.categories[this.props.activeCategory].populations).length > 1;

        return (
            <Chart
                {...this.props}
                data={formatted.data}
                legend={formatted.legend}
                showLegend={showLegend}

                yUnit = {this.props.axes.y && this.props.axes.y.unit}
                xUnit = {this.props.axes.x && this.props.axes.x.unit}

                yLabel = {this.props.axes.y && this.props.axes.y.label}
                xLabel = {this.props.axes.x && this.props.axes.x.label}

                suggestedYMin = {this.props.axes.y && this.props.axes.y.suggestedMin}
                suggestedYMax = {this.props.axes.y && this.props.axes.y.suggestedMax}
            />
        );
    }
}
