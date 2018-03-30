import React from 'react';

import Chart from '../views/Chart';


export default class extends React.Component {
    constructor(props) {
        super(props);

        this.minChartWidth = 264;
        this.maxChartWidth = 500;

        // The proper chart width can't be determined until it's parent element
        // is rendered.
        this.state = { chartWidth: null };

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
        this.formattedData = this.formatData(props.categories[props.activeCategory].populations);
        this.showLegend = Object.keys(props.categories[props.activeCategory].populations).length > 1;

        this.markers = null;
        if (props.axes.x && props.axes.x.annotations) {
            this.markers = props.axes.x.annotations.map(annotationMeta => {
                // Rename "value" to "x". MG requires that the name of this
                // property matches the value of x_accessor.
                const newAM = {};
                newAM.x = new Date(annotationMeta.value);
                newAM.label = annotationMeta.label;
                return newAM;
            });
        }
    }

    // Get the responsive chart width up to a max of desktopChartWidth.
    getChartWidth() {
        const parentNode = document.querySelector('#application > main');
        const parentWidth = parentNode.offsetWidth;

        let width = 0;
        if (parentNode && parentWidth <= this.minChartWidth) {
            width = this.minChartWidth;
        } else if (parentNode && parentWidth > this.maxChartWidth) {
            width = this.maxChartWidth;
        } else if (parentNode) {
            width = parentWidth;
        } else {
            width = this.maxChartWidth;
        }

        return width;
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps !== this.props) {
            this._initialize(nextProps);
        }
    }

    componentDidMount() {
        // Set the chart width based on the real, rendered parent container.
        this.setState({
            chartWidth: this.getChartWidth()
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

                yUnit = {this.props.axes.y && this.props.axes.y.unit}
                xUnit = {this.props.axes.x && this.props.axes.x.unit}

                suggestedYMin = {this.props.axes.y && this.props.axes.y.suggestedMin}
                suggestedYMax = {this.props.axes.y && this.props.axes.y.suggestedMax}

                {...extraProps}
            />
        );
    }
}
