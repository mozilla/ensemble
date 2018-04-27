import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';
import dateformat from 'dateformat';
import { curveCatmullRom } from 'd3-shape';
import distinctColors from 'distinct-colors';

import { prettifyNumber } from '../../lib/utils';

import 'metrics-graphics/dist/metricsgraphics.css';
import './css/Chart.css';
import './css/Metric.css';


export default props => {
    const extraOptions = {};

    // metrics-graphics will give each population up to this number a unique
    // color. (The 11th unique color is black.) If a chart has more populations
    // than this, all remaining populations will also be colored black.
    const mgNumUniqueColors = 11;

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

        // Work around this bug:
        // https://github.com/metricsgraphics/metrics-graphics/issues/838
        extraOptions.left = 80;
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

    if (props.markers) {
        extraOptions.markers = props.markers;
    }

    // If we have more populations than metrics-graphics can assign unique
    // colors to, we need to generate a unique color for each population
    // manually.
    //
    // The settings passed to distinctColors were chosen such that the generated
    // colors will be readable on a white background.
    if (props.numPopulations > mgNumUniqueColors) {
        extraOptions.colors = distinctColors({
            count: props.numPopulations,
            lightMin: 30,
            lightMax: 85,
            chromaMin: 10,
        }).map(c => c.hex());
    }

    return (
        <div className="metric chart">
            <MetricsGraphics
                data={props.data}
                x_accessor="x"
                y_accessor="y"

                show_tooltips={false}

                height={props.height}
                width={props.width}

                x_mouseover={dp => dateformat(dp.x, 'mmmm d, yyyy') + ': '}
                y_mouseover={dp => prettifyNumber(dp.y) + yUnitString}

                min_y={minYToShow}
                max_y={maxYToShow}

                interpolate={curveCatmullRom.alpha(0.5)}

                // Turn off animations when chart data changes. This isn't
                // possible when code-splitting is used, anyway.
                transition_on_update={false}

                {...extraOptions}
            />
        </div>
    );
};
