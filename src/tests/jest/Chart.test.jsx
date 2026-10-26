import { render } from '@testing-library/react';
import MetricsGraphics from 'react-metrics-graphics';

import Chart from '../../components/views/Chart';


// metrics-graphics needs real layout; these tests check the options the view
// computes and hands to it.
vi.mock('react-metrics-graphics', () => ({ default: vi.fn(() => null) }));

const twoPopulations = [
    [{ x: new Date('2026-01-04'), y: 5 }, { x: new Date('2026-01-11'), y: 4 }, { x: new Date('2026-01-18'), y: 9 }],
    [{ x: new Date('2026-01-04'), y: 7 }, { x: new Date('2026-01-11'), y: 2 }, { x: new Date('2026-01-18'), y: 8 }],
];

function optionsFor(props) {
    MetricsGraphics.mockClear();
    render(<Chart width={600} height={400} {...props} />);
    return MetricsGraphics.mock.calls.at(-1)[0];
}

it('The y range starts at 0 for positive data and ends 10% above the highest value', () => {
    const options = optionsFor({ data: twoPopulations });

    expect(options.min_y).toBe(0);
    expect(options.max_y).toBeCloseTo(9.9);
});

it('A suggested minimum below the data is used, and one that would crop data is ignored', () => {
    const highData = [[{ x: new Date('2026-01-04'), y: 100 }, { x: new Date('2026-01-11'), y: 101 }]];

    expect(optionsFor({ data: highData }).min_y).toBe(92);
    expect(optionsFor({ data: highData, suggestedYMin: 50 }).min_y).toBe(50);
    expect(optionsFor({ data: highData, suggestedYMin: 95 }).min_y).toBe(92);
});

it('A suggested maximum above the data is used, and one that would crop data is ignored', () => {
    expect(optionsFor({ data: twoPopulations, suggestedYMax: 100 }).max_y).toBe(100);
    expect(optionsFor({ data: twoPopulations, suggestedYMax: 9.5 }).max_y).toBeCloseTo(9.9);
});

it('A % unit is appended to the y-axis ticks; other units become a y-axis label', () => {
    const percentOptions = optionsFor({ data: twoPopulations, yUnit: '%' });
    expect(percentOptions).toMatchObject({ yax_units: '%', yax_units_append: true });
    expect(percentOptions).not.toHaveProperty('y_label');
    expect(percentOptions).not.toHaveProperty('left');

    const hoursOptions = optionsFor({ data: twoPopulations, yUnit: 'hours' });
    expect(hoursOptions).toMatchObject({ y_label: 'hours', left: 80 });
    expect(hoursOptions).not.toHaveProperty('yax_units');
});

it('Dates are shown in UTC, and hovered values carry their unit', () => {
    const percentOptions = optionsFor({ data: twoPopulations, yUnit: '%' });

    expect(percentOptions.utc_time).toBe(true);
    expect(percentOptions.x_mouseover({ x: new Date('2026-01-04') })).toBe('January 4, 2026: ');
    expect(percentOptions.y_mouseover({ y: 12.5 })).toBe('12.500%');

    const hoursOptions = optionsFor({ data: twoPopulations, yUnit: 'hours' });
    expect(hoursOptions.y_mouseover({ y: 1500 })).toBe('1,500 hours');

    const unitlessOptions = optionsFor({ data: twoPopulations });
    expect(unitlessOptions.y_mouseover({ y: 1500 })).toBe('1,500');
});

it('The legend and its target are passed only when the legend is shown', () => {
    const shown = optionsFor({ data: twoPopulations, showLegend: true, legend: ['High', 'Low'], legendTarget: '#metric-overview-1 .legend' });
    expect(shown).toMatchObject({ legend: ['High', 'Low'], legend_target: '#metric-overview-1 .legend' });

    const hidden = optionsFor({ data: twoPopulations, showLegend: false, legend: ['High', 'Low'], legendTarget: '#metric-overview-1 .legend' });
    expect(hidden).not.toHaveProperty('legend');
    expect(hidden).not.toHaveProperty('legend_target');
});

it('Annotation markers are forwarded unchanged', () => {
    const markers = [{ x: new Date('2026-01-11'), label: 'Firefox 150' }];

    expect(optionsFor({ data: twoPopulations, markers }).markers).toBe(markers);
    expect(optionsFor({ data: twoPopulations })).not.toHaveProperty('markers');
});

it('Charts with more than 11 populations get one generated color per population', () => {
    expect(optionsFor({ data: twoPopulations, numPopulations: 11 })).not.toHaveProperty('colors');

    const colors = optionsFor({ data: twoPopulations, numPopulations: 12 }).colors;
    expect(colors).toHaveLength(12);
    expect(new Set(colors).size).toBe(12);
    colors.forEach(color => expect(color).toMatch(/^#[0-9a-f]{6}$/i));
});

it('The data and size are passed through', () => {
    const options = optionsFor({ data: twoPopulations });

    expect(options).toMatchObject({ data: twoPopulations, width: 600, height: 400, x_accessor: 'x', y_accessor: 'y' });
});

it('Zero values are part of the range, which then starts at 0', () => {
    const options = optionsFor({ data: [[{ x: new Date('2026-01-04'), y: 0 }, { x: new Date('2026-01-11'), y: 10 }]] });

    expect(options.min_y).toBe(0);
    expect(options.max_y).toBe(11);
});

it('A constant series sits on the bottom of a range that ends 10% above it', () => {
    const options = optionsFor({ data: [[{ x: new Date('2026-01-04'), y: 5 }, { x: new Date('2026-01-11'), y: 5 }]] });

    expect(options.min_y).toBe(5);
    expect(options.max_y).toBe(5.5);
});

it('A series that is constantly 0 gets an empty range, [0, 0]', () => {
    // Pinned as current behavior: the 10% padding is relative, so it adds
    // nothing to 0. No metric has had an all-zero series so far.
    const options = optionsFor({ data: [[{ x: new Date('2026-01-04'), y: 0 }, { x: new Date('2026-01-11'), y: 0 }]] });

    expect(options.min_y).toBe(0);
    expect(options.max_y).toBe(0);
});

it('A chart with no plottable points gets non-finite bounds', () => {
    // Pinned as current behavior. metrics-graphics then throws while drawing;
    // the fixtures/boundaries.spec.js Playwright spec covers what the page shows.
    const options = optionsFor({ data: [[], []] });

    expect(options.min_y).toBe(Infinity);
    expect(options.max_y).toBe(-Infinity);
});
