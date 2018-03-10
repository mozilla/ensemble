import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';
import dateformat from 'dateformat';

import 'metrics-graphics/dist/metricsgraphics.css';
import './css/PopulationColors.css';
import './css/MGDarkTheme.css';


export default props => {
    const extraOptions = {};
    const yRolloverSignificantDigits = 10;

    // Units that can appear right after a value, without a space in between
    const spacelessUnits = ['%'];

    // Units that can appear to the right of the tick marks on the y-axis
    const appendableUnits = ['%'];

    // Some units are small enough that they can appear to the right of the tick
    // marks on the y-axis. Everything else should be shown as a label instead;
    if (appendableUnits.includes(props.yUnit)) {
        extraOptions.yax_units = props.yUnit;
        extraOptions.yax_units_append = true;
    } else {
        extraOptions.y_label = props.yUnit;
    }

    // Build the string that will be used to represent the y-axis unit in the
    // tooltip.
    let yUnitString;
    if (props.yUnit) {
        yUnitString = spacelessUnits.includes(props.yUnit) ? props.yUnit : ' ' + props.yUnit;
    } else {
        yUnitString = '';
    }

    // The minimum and maximum y values among all populations.
    //
    // Remember that props.data is a two-dimensional array. The outer array
    // contains all populations and the inner array, which represents a single
    // population, contains all of the data points for that population.
    //
    // For example, if props.data were the following two-dimensional array, minY
    // would be 2 and maxY would be 9.
    //
    // [
    //     [
    //         { x: 1, y: 5 },
    //         { x: 2, y: 4 },
    //         { x: 3, y: 9 }
    //     ],
    //     [
    //         { x: 1, y: 7 },
    //         { x: 2, y: 2 },
    //         { x: 3, y: 8 }
    //     ]
    //  ]
    const allYValues = props.data.reduce((accumulator, currentDataset) => {
        return accumulator.concat(currentDataset.map(dataPoint => dataPoint.y));
    }, []);
    const maxY = Math.max(...allYValues);
    const minY = Math.min(...allYValues);

    // The minimum and maximum y values that can actually be used on the y
    // scale.
    //
    // These numbers are just minY and maxY with some padding added. The padding
    // is added because there is a bug in metrics-graphics where the curve of a
    // line can be cut off unless this padding is added.
    //
    // https://github.com/mozilla/metrics-graphics/issues/823
    const padding = .1;
    const minVisibleY = minY - (minY * padding);
    const maxVisibleY = maxY + (maxY * padding);

    // The range of values that should be shown on the y-axis scale. The low
    // value is chosen such that the graph doesn't look flat, but changes in
    // data don't look more extreme than they really are either.
    const multiplier = 8;
    let minYToShow = minY - ((maxY - minY) * multiplier);
    let maxYToShow = maxVisibleY;

    // The math above is such that minYToShow might be below zero (sometimes way
    // below zero) when the actual minimum y-value in the data is actually >0
    // zero. When that happens, make minYToShow 0 so that we don't have a
    // useless negative y space in the chart.
    if (minY >= 0 && minYToShow < 0) {
        minYToShow = 0;
    }

    // If the data suggests that different numbers be used for the low and high
    // ticks, and those choices wouldn't crop out any data, use them instead.
    if (props.suggestedYMin < minVisibleY) {
        minYToShow = props.suggestedYMin;
    }
    if (props.suggestedYMax > maxVisibleY) {
        maxYToShow = props.suggestedMax;
    }

    if (props.showLegend) {
        extraOptions.legend = props.legend;
        extraOptions.legend_target = props.legendTarget;
    }

    return (
        <MetricsGraphics
            title={props.title}
            show_tooltips={false}
            data={props.data}
            x_accessor="x"
            y_accessor="y"

            width={500}
            height={500}

            x_mouseover={dp => dateformat(dp.x, 'mmmm d, yyyy') + ': '}
            y_mouseover={dp => dp.y.toLocaleString('en-US', { maximumSignificantDigits: yRolloverSignificantDigits }) + yUnitString}

            min_y={minYToShow}
            max_y={maxYToShow}

            {...extraOptions}
        />
    );
};
