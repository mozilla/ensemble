import dateformat from 'dateformat';
import distinctColors from 'distinct-colors';
import * as Plot from '@observablehq/plot';

import { prettifyNumber } from '../../lib/utils';
import ObservablePlot from './ObservablePlot';

import './css/Chart.css';
import './css/Metric.css';


// The colors the site has always used for the first eleven populations. Charts
// with more populations than this get a generated color for each population
// instead.
const paletteForUpToElevenPopulations = [
    '#4040e8',
    '#05b378',
    '#db4437',
    '#f8b128',
    '#5c5c5c',
    '#4682b4',
    '#f673bf',
    '#0b73b0',
    '#006400',
    '#92514f',
    '#000000',
];

// Room above the chart for each row of annotation labels.
const markerLabelRowHeight = 20;

// An estimate of how wide one character of an annotation label is, used to
// decide which labels would overlap if they shared a row.
const markerLabelCharacterWidth = 7;
const markerLabelGap = 8;

const defaultMarginLeft = 50;

// Writes 200,000,000 as "200M", so long y-axis values fit beside the axis.
const compactNumber = new Intl.NumberFormat('en-US', { notation: 'compact' });
const marginRight = 20;

// Give each marker a row so that no two labels in the same row overlap. Row 0
// sits just above the chart, and each later row sits above the one before it.
function assignMarkerRows(markers, xToPixel) {
    const rowEnds = [];

    return markers.toSorted((markerA, markerB) => markerA.x - markerB.x).map(marker => {
        const halfWidth = (marker.label.length * markerLabelCharacterWidth) / 2;
        const center = xToPixel(marker.x);
        let row = rowEnds.findIndex(rowEnd => center - halfWidth >= rowEnd + markerLabelGap);
        if (row === -1) {
            row = rowEnds.length;
            rowEnds.push(0);
        }
        rowEnds[row] = center + halfWidth;
        return { ...marker, row };
    });
}

// Add an empty point for each date a population skips between its first and
// last points, so its line breaks there instead of joining across the gap. A
// date counts as skipped when another population on the chart has it.
function withGaps(sortedPoints, chartDates, population) {
    if (!sortedPoints.length) return [];

    const pointsByDate = new Map(sortedPoints.map(point => [+point.x, point]));
    const first = +sortedPoints[0].x;
    const last = +sortedPoints.at(-1).x;

    return chartDates
        .filter(date => date >= first && date <= last)
        .map(date => ({ ...(pointsByDate.get(date) || { x: new Date(date), y: null }), population }));
}

// A point with a gap or the end of its line on both sides has no line through
// it, so it needs drawing on its own.
function isolatedPoints(pointsWithGaps) {
    return pointsWithGaps.filter((point, index) => (
        point.y !== null
        && (pointsWithGaps[index - 1]?.y ?? null) === null
        && (pointsWithGaps[index + 1]?.y ?? null) === null
    ));
}

export default props => {
    // Units that can appear right after a value, without a space in between
    const spacelessUnits = ['%'];

    // Units that can appear to the right of the tick marks on the y-axis
    const appendableUnits = ['%'];

    // Build the string that will be used to represent the y-axis unit in the
    // hovered value.
    let yUnitString;
    if (props.yUnit) {
        yUnitString = spacelessUnits.includes(props.yUnit) ? props.yUnit : ' ' + props.yUnit;
    } else {
        yUnitString = '';
    }

    const legend = props.legend || props.data.map((population, index) => `Population ${index + 1}`);

    // Plot joins a line's points in the order it is given them, and the data
    // does not always arrive in date order.
    const points = props.data.flatMap((population, index) => (
        population.toSorted((pointA, pointB) => pointA.x - pointB.x).map(point => ({ ...point, population: legend[index] }))
    ));

    if (!points.length) {
        return <p className="chart-empty">No data to show for this metric.</p>;
    }

    // Populations hidden from the legend are left out of everything drawn and
    // of the y range, but still count toward the dates and the x range, so the
    // chart doesn't shift sideways when one is hidden.
    let hiddenPopulations = props.hiddenPopulations || [];
    if (points.every(point => hiddenPopulations.includes(point.population))) {
        hiddenPopulations = [];
    }
    const visiblePopulations = legend.filter(populationName => !hiddenPopulations.includes(populationName));
    const visiblePoints = points.filter(point => visiblePopulations.includes(point.population));

    const chartDates = [...new Set(points.map(point => +point.x))].sort((dateA, dateB) => dateA - dateB);
    const linePoints = visiblePopulations.flatMap(populationName => withGaps(
        points.filter(point => point.population === populationName),
        chartDates,
        populationName
    ));
    const loosePoints = visiblePopulations.flatMap(populationName => isolatedPoints(
        linePoints.filter(point => point.population === populationName)
    ));

    // The minimum and maximum y values among all populations.
    const allYValues = visiblePoints.map(point => point.y);
    const maxY = Math.max(...allYValues);
    const minY = Math.min(...allYValues);

    // The minimum and maximum y values that can actually be used on the y
    // scale: minY and maxY with some padding added, so that the curve of a line
    // through the highest or lowest point is not cut off.
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
        maxYToShow = props.suggestedYMax;
    }

    // Some units are small enough that they can appear to the right of the tick
    // marks on the y-axis. Everything else is shown as a label instead.
    let marginLeft = defaultMarginLeft;
    const yOptions = { domain: [minYToShow, maxYToShow], label: null, ticks: 3, tickFormat: tick => compactNumber.format(tick) };
    if (appendableUnits.includes(props.yUnit)) {
        yOptions.tickFormat = tick => compactNumber.format(tick) + props.yUnit;
    } else if (props.yUnit) {
        marginLeft = 80;
        Object.assign(yOptions, { label: props.yUnit, labelAnchor: 'center', labelArrow: 'none' });
    }

    // The x domain comes from the data alone, so that an annotation outside it
    // neither widens the chart nor gets drawn.
    const allXValues = points.map(point => point.x);
    const xDomain = [Math.min(...allXValues), Math.max(...allXValues)];
    const markersInRange = (props.markers || []).filter(marker => marker.x >= xDomain[0] && marker.x <= xDomain[1]);

    const frameWidth = props.width - marginLeft - marginRight;
    const xToPixel = x => xDomain[1] === xDomain[0] ? 0 : ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * frameWidth;
    const markersWithRows = assignMarkerRows(markersInRange, xToPixel);
    const markerRowCount = markersWithRows.length ? Math.max(...markersWithRows.map(marker => marker.row)) + 1 : 0;
    const marginTop = (markerRowCount * markerLabelRowHeight) + 10;

    const markerLabelMarks = [...Array(markerRowCount).keys()].map(row => Plot.text(
        markersWithRows.filter(marker => marker.row === row),
        { x: 'x', text: 'label', frameAnchor: 'top', dy: -((row + 1) * markerLabelRowHeight), className: 'chart-marker-label' }
    ));

    let colors;
    if (props.numPopulations > paletteForUpToElevenPopulations.length) {
        // The settings passed to distinctColors were chosen such that the
        // generated colors will be readable on a white background.
        colors = distinctColors({
            count: props.numPopulations,
            lightMin: 30,
            lightMax: 85,
            chromaMin: 10,
        }).map(color => color.hex());
    } else {
        colors = paletteForUpToElevenPopulations;
    }

    // While a legend entry is hovered, every other population fades so that
    // the hovered one stands out.
    const highlightedPopulation = visiblePopulations.includes(props.highlightedPopulation) ? props.highlightedPopulation : null;
    const opacityFor = point => (highlightedPopulation && point.population !== highlightedPopulation ? .15 : 1);

    // Large enough that every spot on the chart is within reach of some point,
    // as the hover worked before.
    const hoverRadius = Math.hypot(props.width, props.height);

    // On a chart with several lines, the hovered value is labelled with its
    // population's name in that population's color.
    const renderReadout = point => (
        <>
            <span style={{ color: colors[legend.indexOf(point.population)] }}>
                {props.data.length > 1 ? `${point.population} — ` : '— '}
            </span>
            {dateformat(point.x, 'mmmm d, yyyy', true) + ': ' + prettifyNumber(point.y) + yUnitString}
        </>
    );

    // A chart with a single population is shaded below its line.
    const maybeArea = props.data.length === 1 ? [
        Plot.areaY(linePoints, { x: 'x', y1: minYToShow, y2: 'y', curve: 'catmull-rom', fill: '#0000ff', fillOpacity: .2, className: 'chart-area' }),
    ] : [];

    const options = {
        width: props.width,
        height: props.height,
        marginTop,
        marginLeft,
        marginRight,
        className: 'chart-svg',
        style: { fontFamily: 'inherit', fontSize: '11px' },
        x: { type: 'utc', domain: xDomain, label: null, ticks: 6 },
        y: yOptions,
        color: { domain: legend, range: colors },
        marks: [
            Plot.frame({ anchor: 'left', stroke: '#b3b2b2', className: 'chart-axis-line' }),
            Plot.frame({ anchor: 'bottom', stroke: '#b3b2b2', className: 'chart-axis-line' }),
            Plot.ruleX(markersInRange, { x: 'x', stroke: '#b3b2b2', strokeDasharray: '3,1', className: 'chart-marker' }),
            ...markerLabelMarks,
            ...maybeArea,
            Plot.line(linePoints, { x: 'x', y: 'y', z: 'population', stroke: 'population', strokeOpacity: opacityFor, strokeWidth: 1, curve: 'catmull-rom', className: 'chart-line' }),
            Plot.dot(loosePoints, { x: 'x', y: 'y', fill: 'population', fillOpacity: opacityFor, r: 3, className: 'chart-point' }),
            Plot.dot(visiblePoints, Plot.pointer({ x: 'x', y: 'y', fill: 'population', r: 4, maxRadius: hoverRadius, className: 'chart-hover-point' })),
        ],
    };

    let maybeLegend = null;
    if (props.showLegend) {
        maybeLegend = (
            <div className="legend">
                {legend.map((populationName, index) => {
                    const hidden = hiddenPopulations.includes(populationName);
                    // Hiding the last population with points left would leave
                    // nothing to draw.
                    const onlyOneShown = !hidden && visiblePoints.length > 0
                        && visiblePoints.every(point => point.population === populationName);
                    return (
                        <button
                            key={populationName}
                            type="button"
                            className="legend-entry"
                            style={{ color: colors[index] }}
                            aria-pressed={!hidden}
                            disabled={onlyOneShown}
                            title={onlyOneShown ? null : `${hidden ? 'Show' : 'Hide'} ${populationName}`}
                            onClick={() => props.onLegendToggle?.(populationName)}
                            onMouseEnter={() => props.onLegendHover?.(hidden ? null : populationName)}
                            onMouseLeave={() => props.onLegendHover?.(null)}
                            onFocus={() => props.onLegendHover?.(hidden ? null : populationName)}
                            onBlur={() => props.onLegendHover?.(null)}
                        >
                            — {populationName}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            <div className="metric chart">
                <ObservablePlot options={options} renderReadout={renderReadout} />
            </div>
            {maybeLegend}
        </>
    );
};
