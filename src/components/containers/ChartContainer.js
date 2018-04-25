import React from 'react';

import Chart from '../views/Chart';


export default class extends React.Component {
    constructor(props) {
        super(props);

        this.minChartWidth = 264;
        this.maxChartHeight = 400;

        // The proper chart width can't be determined until it's parent element
        // is rendered.
        this.state = {
            chartWidth: 0,
            chartHeight: this.maxChartHeight
        };

        this._initialize(props);
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

    _initialize = props => {
        this.formattedData = this.formatData(props.data[props.activeCategory].populations);
        this.showLegend = Object.keys(props.data[props.activeCategory].populations).length > 1;

        this.markers = [];
        if (props.annotations && props.annotations[props.activeCategory]) {
            this.markers = props.annotations[props.activeCategory].map(annotationMeta => {
                // Rename "date" to "x". MG requires that the name of this
                // property matches the value of x_accessor.
                return {
                    x: new Date(annotationMeta.date),
                    label: annotationMeta.label,
                };
            });
        }
    }

    // Get the responsive chart size or set to minChartWidth and maxChartHeight.
    getChartSize() {
        const parentNode = document.querySelector('#application > main');
        const parentWidth = parentNode.offsetWidth;

        let size = {width: this.minChartWidth, height: this.maxChartHeight};
        if (parentNode && parentWidth > this.minChartWidth) {
            size.width = parentWidth;

            // Square ratio charts for small screens.
            if (parentWidth <= this.maxChartHeight) {
                size.height = parentWidth;
            }
        }

        return size;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            this._initialize(nextProps);
        }
    }

    componentDidMount() {
        // Set the chart width based on the real, rendered parent container.
        this.setState({
            chartWidth: this.getChartSize().width,
            chartHeight: this.getChartSize().height
        });
    }

    render() {
        // Don't render the chart until a proper width has been determined. If
        // we didn't do this, if we instead started with some default width and
        // then switched to the proper width, the chart would animate shortly
        // after loading.
        if (!this.state.chartWidth) return null;

        const extraProps = {};

        if (this.markers) {
            extraProps.markers = this.markers;
        }

        return (
            <Chart
                {...this.props}
                data={this.formattedData.data}
                legend={this.formattedData.legend}
                showLegend={this.showLegend}
                width={this.state.chartWidth}
                height={this.state.chartHeight}

                yUnit = {this.props.axes.y && this.props.axes.y.unit}
                xUnit = {this.props.axes.x && this.props.axes.x.unit}

                suggestedYMin = {this.props.axes.y && this.props.axes.y.suggestedMin}
                suggestedYMax = {this.props.axes.y && this.props.axes.y.suggestedMax}

                {...extraProps}
            />
        );
    }
}
