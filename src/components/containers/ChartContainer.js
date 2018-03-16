import React from 'react';

import Chart from '../views/Chart';


export default class extends React.Component {
    constructor(props) {
        super(props);

        // Set the minimum chart width supported at 320px viewport width.
        this.state = { chartWidth: 264 };

        // 500px SVG width.
        this.desktopChartWidth = 500;
    }

    formatData(populations) {
        const data = [];
        const legend = [];

        // Sort population names by y value. The population with the highest y
        // value is first and the population with the lowest y value is last.
        const sortedPopulationNames = Object.keys(populations).sort((populationNameA, populationNameB) => {
            const aMaxY = Math.max(...populations[populationNameA].map(dp => dp.y));
            const bMaxY = Math.max(...populations[populationNameB].map(dp => dp.y));

            if (aMaxY > bMaxY) return -1;
            if (bMaxY > aMaxY) return 1;
            return 0;
        });

        sortedPopulationNames.forEach(populationName => {
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
        });

        return { data, legend };
    }

    // Get the responsive chart width up to a max of desktopChartWidth.
    getChartWidth() {
        const parentNode = document.querySelector('#application > main');
        const width = parentNode ? parentNode.offsetWidth : this.desktopChartWidth;

        return width > this.desktopChartWidth ? this.desktopChartWidth : width;
    }

    componentDidMount() {
        // Set the chart width based on the real, rendered parent container.
        this.setState({
            chartWidth: this.getChartWidth()
        });
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
                width={this.state.chartWidth}

                yUnit = {this.props.axes.y && this.props.axes.y.unit}
                xUnit = {this.props.axes.x && this.props.axes.x.unit}

                suggestedYMin = {this.props.axes.y && this.props.axes.y.suggestedMin}
                suggestedYMax = {this.props.axes.y && this.props.axes.y.suggestedMax}
            />
        );
    }
}
