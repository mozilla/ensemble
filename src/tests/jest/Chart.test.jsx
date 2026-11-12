import { act, render } from '@testing-library/react';
import Chart from '../../components/views/Chart';


const dates = ['2026-01-04', '2026-01-11', '2026-01-18'].map(date => new Date(date));

const twoPopulations = [
    [{ x: dates[0], y: 5 }, { x: dates[1], y: 4 }, { x: dates[2], y: 9 }],
    [{ x: dates[0], y: 7 }, { x: dates[1], y: 2 }, { x: dates[2], y: 8 }],
];

function renderChart(props) {
    const { container } = render(<Chart width={600} height={400} legend={['High', 'Low']} {...props} />);
    const svg = container.querySelector('svg.chart-svg');
    return { container, svg };
}

function yDomain(props) {
    return renderChart(props).svg.scale('y').domain;
}

function lineStrokes(svg) {
    return [...svg.querySelectorAll('g.chart-line path')].map(path => path.getAttribute('stroke'));
}

function legendEntries(container) {
    return [...container.querySelectorAll('.legend .legend-entry')].map(entry => ({
        text: entry.textContent.trim(),
        color: entry.style.color,
    }));
}

function cssColor(hex) {
    const element = document.createElement('span');
    element.style.color = hex;
    return element.style.color;
}

function pathXCoordinates(path) {
    return [...path.getAttribute('d').matchAll(/[MLC]([-\d.]+),/g)].map(match => Number(match[1]));
}

it('The y range starts at 0 for positive data and ends 10% above the highest value', () => {
    const [low, high] = yDomain({ data: twoPopulations });

    expect(low).toBe(0);
    expect(high).toBeCloseTo(9.9);
});

it('A suggested minimum below the data is used, and one that would crop data is ignored', () => {
    const highData = [[{ x: dates[0], y: 100 }, { x: dates[1], y: 101 }]];

    expect(yDomain({ data: highData, legend: ['Only'] })[0]).toBe(92);
    expect(yDomain({ data: highData, legend: ['Only'], suggestedYMin: 50 })[0]).toBe(50);
    expect(yDomain({ data: highData, legend: ['Only'], suggestedYMin: 95 })[0]).toBe(92);
});

it('A suggested maximum above the data is used, and one that would crop data is ignored', () => {
    expect(yDomain({ data: twoPopulations, suggestedYMax: 100 })[1]).toBe(100);
    expect(yDomain({ data: twoPopulations, suggestedYMax: 9.5 })[1]).toBeCloseTo(9.9);
});

it('A % unit is appended to the y-axis ticks; other units become a y-axis label', () => {
    const percent = renderChart({ data: twoPopulations, yUnit: '%' }).svg;
    const percentTicks = [...percent.querySelectorAll('g[aria-label="y-axis tick label"] text')].map(tick => tick.textContent);
    expect(percentTicks.length).toBeGreaterThan(1);
    percentTicks.forEach(tick => expect(tick).toMatch(/^[\d.,]+%$/));
    expect(percent.querySelector('g[aria-label="y-axis label"]')).toBeNull();

    const hours = renderChart({ data: twoPopulations, yUnit: 'hours' }).svg;
    expect(hours.querySelector('g[aria-label="y-axis label"]')).toHaveTextContent('hours');
    [...hours.querySelectorAll('g[aria-label="y-axis tick label"] text')].forEach(tick => expect(tick.textContent).not.toMatch(/hours/));
});

it('Large y-axis values are abbreviated', () => {
    const svg = renderChart({ data: [[{ x: dates[0], y: 150000000 }, { x: dates[1], y: 200000000 }]], legend: ['Only'] }).svg;
    const ticks = [...svg.querySelectorAll('g[aria-label="y-axis tick label"] text')].map(tick => tick.textContent);

    expect(ticks).toContain('200M');
});

it('Hovering shows the date in UTC and the value with its unit, labelled with the population', () => {
    const { container, svg } = renderChart({ data: twoPopulations, yUnit: 'hours' });
    const readout = container.querySelector('.chart-readout');

    expect(readout).toHaveTextContent(/^$/);

    act(() => {
        svg.value = { x: dates[0], y: 1500, population: 'Low' };
        svg.dispatchEvent(new Event('input'));
    });
    expect(readout).toHaveTextContent('Low — January 4, 2026: 1,500 hours');
    expect(readout.querySelector('span').style.color).toBe(cssColor('#05b378'));
    expect(readout.querySelector('.chart-readout-population').title).toBe('Low');

    act(() => {
        svg.value = null;
        svg.dispatchEvent(new Event('input'));
    });
    expect(readout).toHaveTextContent(/^$/);
});

it('A hovered % value has no space before its unit, and a single population is not named', () => {
    const { container, svg } = renderChart({ data: [twoPopulations[0]], legend: ['Only'], yUnit: '%' });

    act(() => {
        svg.value = { x: dates[1], y: 12.5, population: 'Only' };
        svg.dispatchEvent(new Event('input'));
    });
    expect(container.querySelector('.chart-readout')).toHaveTextContent('— January 11, 2026: 12.500%');
});

it('The legend lists every population in order, in the color of its line', () => {
    const { container, svg } = renderChart({ data: twoPopulations, showLegend: true });

    expect(legendEntries(container)).toEqual([
        { text: '— High', color: cssColor('#4040e8') },
        { text: '— Low', color: cssColor('#05b378') },
    ]);
    expect(lineStrokes(svg)).toEqual(['#4040e8', '#05b378']);
});

it('The legend is left out when it is not shown', () => {
    const { container } = renderChart({ data: twoPopulations, showLegend: false });

    expect(container.querySelector('.legend')).toBeNull();
});

it('A population with no points keeps its legend entry and color, and the others keep theirs', () => {
    const { container, svg } = renderChart({
        data: [twoPopulations[0], [], twoPopulations[1]],
        legend: ['High', 'Missing', 'Low'],
        showLegend: true,
    });

    expect(legendEntries(container).map(entry => entry.text)).toEqual(['— High', '— Missing', '— Low']);
    expect(legendEntries(container)[1].color).toBe(cssColor('#05b378'));
    expect(lineStrokes(svg)).toEqual(['#4040e8', '#db4437']);
});

it('Charts with more than 11 populations get one generated color per population, matching the legend', () => {
    const twelvePopulations = [...Array(12).keys()].map(index => dates.map(x => ({ x, y: 100 - index })));
    const legend = twelvePopulations.map((population, index) => `Population ${index + 1}`);
    const { container, svg } = renderChart({ data: twelvePopulations, legend, numPopulations: 12, showLegend: true });

    const strokes = lineStrokes(svg);
    expect(strokes).toHaveLength(12);
    expect(new Set(strokes).size).toBe(12);
    expect(legendEntries(container).map(entry => entry.color)).toEqual(strokes.map(cssColor));
});

it('Up to 11 populations use the site palette, the 11th being black', () => {
    const elevenPopulations = [...Array(11).keys()].map(index => dates.map(x => ({ x, y: 100 - index })));
    const legend = elevenPopulations.map((population, index) => `Population ${index + 1}`);
    const strokes = lineStrokes(renderChart({ data: elevenPopulations, legend, numPopulations: 11 }).svg);

    expect(strokes[0]).toBe('#4040e8');
    expect(strokes[10]).toBe('#000000');
});

it('Lines are drawn in date order even when the data is not', () => {
    const shuffled = [[{ x: dates[2], y: 9 }, { x: dates[0], y: 5 }, { x: dates[1], y: 4 }]];
    const original = structuredClone(shuffled);
    const svg = renderChart({ data: shuffled, legend: ['Only'] }).svg;

    const xs = pathXCoordinates(svg.querySelector('g.chart-line path'));
    xs.slice(1).forEach((x, index) => expect(x).toBeGreaterThanOrEqual(xs[index]));
    expect(shuffled).toEqual(original);
});

it('A single population is shaded below its line; several populations are not', () => {
    expect(renderChart({ data: [twoPopulations[0]], legend: ['Only'] }).svg.querySelector('g.chart-area path')).not.toBeNull();
    expect(renderChart({ data: twoPopulations }).svg.querySelector('g.chart-area')).toBeNull();
});

it('A population with a single point is drawn as a dot', () => {
    const svg = renderChart({ data: [[{ x: dates[0], y: 9 }], twoPopulations[1]] }).svg;

    expect(svg.querySelectorAll('g.chart-point circle')).toHaveLength(1);
});

it('Annotations inside the date range are drawn; ones outside it are not', () => {
    const markers = [
        { x: dates[1], label: 'Firefox 150' },
        { x: new Date('2025-06-01'), label: 'Too early' },
    ];
    const svg = renderChart({ data: twoPopulations, markers }).svg;

    expect(svg.querySelectorAll('g.chart-marker line')).toHaveLength(1);
    expect([...svg.querySelectorAll('g.chart-marker-label text')].map(text => text.textContent)).toEqual(['Firefox 150']);
    expect(svg.scale('x').domain).toEqual([dates[0], dates[2]]);
});

function labelCenters(svg) {
    return [...svg.querySelectorAll('g.chart-marker-label text')]
        .map(text => Number(text.getAttribute('transform').match(/translate\(([-\d.]+)/)[1]));
}

it('Labels at either end of the chart are moved inside it, but their rules stay on their dates', () => {
    const svg = renderChart({
        data: twoPopulations,
        width: 600,
        markers: [{ x: dates[0], label: 'Firefox 150 is here' }, { x: dates[2], label: 'Firefox 151' }],
    }).svg;
    // The chart's estimate of a label's width: 7px a character.
    const halfWidths = [19 * 7 / 2, 11 * 7 / 2];
    const [first, last] = labelCenters(svg);

    expect(first - halfWidths[0]).toBeGreaterThan(-.01);
    expect(last + halfWidths[1]).toBeLessThan(600.01);
    expect(last).toBeLessThan(svg.scale('x').apply(dates[2]));
    expect([...svg.querySelectorAll('g.chart-marker line')].map(line => Number(line.getAttribute('x1'))))
        .toEqual([svg.scale('x').apply(dates[0]), svg.scale('x').apply(dates[2])]);
});

it('A label moved inward goes on its own row if it now overlaps its neighbor', () => {
    // Left where it was, "Firefox 151" would start just clear of "B". Moved
    // inside the chart, it would cover it.
    const svg = renderChart({
        data: twoPopulations,
        width: 375,
        markers: [{ x: new Date('2026-01-15T06:00:00Z'), label: 'B' }, { x: dates[2], label: 'Firefox 151' }],
    }).svg;

    expect(svg.querySelectorAll('g.chart-marker-label')).toHaveLength(2);
});

it('Annotation label rows add to the chart\'s height instead of taking space from the data', () => {
    const plain = renderChart({ data: twoPopulations, width: 315, height: 315 }).svg;
    const markers = Array.from({ length: 100 }, (unused, index) => ({
        x: new Date(dates[0].getTime() + (index * (dates[2] - dates[0]) / 99)),
        label: 'Fx150',
    }));
    const annotated = renderChart({ data: twoPopulations, width: 315, height: 315, markers }).svg;

    const plotHeight = svg => Math.abs(svg.scale('y').range[0] - svg.scale('y').range[1]);
    expect(Number(annotated.getAttribute('height'))).toBeGreaterThan(315);
    expect(plotHeight(annotated)).toBe(plotHeight(plain));
});

it('Annotation labels that would overlap go on separate rows; distant ones share a row', () => {
    const near = renderChart({
        data: twoPopulations,
        width: 375,
        markers: [
            { x: dates[0], label: 'Firefox 150' },
            { x: new Date('2026-01-05'), label: 'Firefox 151' },
            { x: new Date('2026-01-06'), label: 'Firefox 152' },
        ],
    }).svg;
    const nearRows = [...near.querySelectorAll('g.chart-marker-label')].map(row => row.getAttribute('transform'));
    expect(nearRows).toHaveLength(3);
    expect(new Set(nearRows).size).toBe(3);

    const far = renderChart({
        data: twoPopulations,
        width: 900,
        markers: [{ x: dates[0], label: 'Firefox 150' }, { x: dates[2], label: 'Firefox 151' }],
    }).svg;
    expect(far.querySelectorAll('g.chart-marker-label')).toHaveLength(1);
    expect(far.querySelectorAll('g.chart-marker-label text')).toHaveLength(2);
});

it('Zero values are part of the range, which then starts at 0', () => {
    expect(yDomain({ data: [[{ x: dates[0], y: 0 }, { x: dates[1], y: 10 }]], legend: ['Only'] })).toEqual([0, 11]);
});

it('A constant series sits on the bottom of a range that ends 10% above it', () => {
    expect(yDomain({ data: [[{ x: dates[0], y: 5 }, { x: dates[1], y: 5 }]], legend: ['Only'] })).toEqual([5, 5.5]);
});

it('A series that is constantly 0 gets an empty range, [0, 0]', () => {
    // Pinned as current behavior: the 10% padding is relative, so it adds
    // nothing to 0. No metric has had an all-zero series so far.
    expect(yDomain({ data: [[{ x: dates[0], y: 0 }, { x: dates[1], y: 0 }]], legend: ['Only'] })).toEqual([0, 0]);
});

it('A chart with no plottable points shows a message instead', () => {
    const { container, svg } = renderChart({ data: [[], []], showLegend: true });

    expect(svg).toBeNull();
    expect(container.querySelector('.legend')).toBeNull();
    expect(container.querySelector('.chart-empty')).toHaveTextContent('No data to show for this metric.');
});

it('The y and x axes are drawn as grey lines along the left and bottom of the chart', () => {
    const svg = renderChart({ data: twoPopulations }).svg;
    const axisLines = [...svg.querySelectorAll('line.chart-axis-line')];

    expect(axisLines).toHaveLength(2);
    axisLines.forEach(line => expect(line.getAttribute('stroke')).toBe('#b3b2b2'));
    const [left, bottom] = axisLines;
    expect(left.getAttribute('x1')).toBe(left.getAttribute('x2'));
    expect(bottom.getAttribute('y1')).toBe(bottom.getAttribute('y2'));
});
