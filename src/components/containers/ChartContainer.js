import React from 'react';

import Chart from '../views/Chart';


class ChartContainer extends React.Component {
    constructor(props) {
        super(props);

        this.minChartWidth = 264;
        this.maxChartHeight = 400;

        // Initial state of chart size.
        // It will later be set based on the width of a rendered layout wrapper DOM node.
        this.state = {
            data: props.data,
            annotations: props.annotations,
            activeCategory: props.activeCategory,
            markers: [],
            chartWidth: 0,
            chartHeight: this.maxChartHeight,
        };
        this.parentNode = null;
    }

    static formatData(populations) {
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

    // Get the responsive chart size or set to minChartWidth and maxChartHeight.
    getChartSize() {
        const size = {width: this.minChartWidth, height: this.maxChartHeight};

        if (!this.parentNode) {
            return size;
        }

        const parentWidth = this.parentNode.offsetWidth;


        if (parentWidth > this.minChartWidth) {
            size.width = parentWidth;

            // Square ratio charts for small screens.
            if (parentWidth <= this.maxChartHeight) {
                size.height = parentWidth;
            }
        }

        return size;
    }

    static getDerivedStateFromProps(props, state) {
        const newState = {};

        const dataChanged = props.data !== state.data;
        const annotationsChanged = props.annotations !== state.annoations;
        const activeCategoryChanged = props.activeCategory !== state.activeCategory;

        if (dataChanged) {
            newState.data = props.data;
        }

        if (annotationsChanged) {
            newState.annotations = props.annotations;
        }

        if (activeCategoryChanged) {
            newState.activeCategory = props.activeCategory;
        }

        if (!state.formattedData || !state.showLegend || dataChanged || activeCategoryChanged) {
            newState.formattedData = ChartContainer.formatData(props.data[props.activeCategory].populations);
            newState.showLegend = Object.keys(props.data[props.activeCategory].populations).length > 1;
        }

        if ((!state.markers || annotationsChanged || activeCategoryChanged) && props.annotations && props.annotations[props.activeCategory]) {
            newState.markers = props.annotations[props.activeCategory].map(annotationMeta => {
                // Rename "date" to "x". MG requires that the name of this
                // property matches the value of x_accessor.
                return {
                    x: new Date(annotationMeta.date),
                    label: annotationMeta.label,
                };
            });
        }

        if (Object.keys(newState).length) return newState;
        return null;
    }

    componentDidMount() {
        this.parentNode = document.querySelector('#application > main');
        this.setChartSize();
        window.addEventListener('resize', this.setChartSize);
    }

    // Set the chart size state based on the real, rendered parent container.
    setChartSize = () => {
        const {width, height} = this.getChartSize();

        this.setState({
            chartWidth: width,
            chartHeight: height,
        });
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.setChartSize);
    }

    render() {
        // Don't render the chart until a proper width has been determined. If
        // we didn't do this, if we instead started with some default width and
        // then switched to the proper width, the chart would animate shortly
        // after loading.
        if (!this.state.chartWidth) return null;

        const extraProps = {};

        if (this.markers) {
            extraProps.markers = this.state.markers;
        }

        return (
            <Chart
                {...this.props}
                data={this.state.formattedData.data}
                legend={this.state.formattedData.legend}
                showLegend={this.state.showLegend}
                width={this.state.chartWidth}
                height={this.state.chartHeight}
                numPopulations={this.props.numPopulations}

                yUnit = {this.props.axes.y && this.props.axes.y.unit}
                xUnit = {this.props.axes.x && this.props.axes.x.unit}

                suggestedYMin = {this.props.axes.y && this.props.axes.y.suggestedMin}
                suggestedYMax = {this.props.axes.y && this.props.axes.y.suggestedMax}

                {...extraProps}
            />
        );
    }
}

export default ChartContainer;
