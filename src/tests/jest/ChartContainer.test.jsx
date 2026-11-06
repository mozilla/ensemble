import { act, render } from '@testing-library/react';

import Chart from '../../components/views/Chart';
import ChartContainer from '../../components/containers/ChartContainer';


// The real view draws an SVG chart; these tests check the props it is given.
vi.mock('../../components/views/Chart', () => ({ default: vi.fn(() => null) }));

// ChartContainer measures #application > main to size the chart.
function renderChart(props) {
    render(
        <div id="application">
            <main>
                <ChartContainer axes={{}} {...props} />
            </main>
        </div>
    );

    return Chart.mock.calls.at(-1)[0];
}

beforeEach(() => {
    Chart.mockClear();
});

it('Populations are ordered by their highest y value, highest first', () => {
    const chartProps = renderChart({
        data: {
            populations: {
                Low: [{ x: '2026-01-01', y: 1 }, { x: '2026-01-08', y: 2 }],
                High: [{ x: '2026-01-01', y: 9 }, { x: '2026-01-08', y: 3 }],
                Middle: [{ x: '2026-01-01', y: 5 }, { x: '2026-01-08', y: 4 }],
            },
        },
    });

    expect(chartProps.legend).toEqual(['High', 'Middle', 'Low']);
    expect(chartProps.data[0].map(point => point.y)).toEqual([9, 3]);
});

it('Points with a null y value are dropped and date strings become Dates', () => {
    const chartProps = renderChart({
        data: {
            populations: {
                MAU: [{ x: '2026-01-01', y: null }, { x: '2026-01-08', y: 250 }],
            },
        },
    });

    expect(chartProps.data).toEqual([[{ x: new Date('2026-01-08'), y: 250 }]]);
});

it('Non-date x values are passed through unchanged', () => {
    const chartProps = renderChart({
        data: {
            populations: {
                Memory: [{ x: '4GB', y: 40 }, { x: '8GB', y: 60 }],
            },
        },
    });

    expect(chartProps.data[0].map(point => point.x)).toEqual(['4GB', '8GB']);
});

it('The legend is shown only when there is more than one population', () => {
    const singleProps = renderChart({ data: { populations: { Only: [{ x: '2026-01-01', y: 1 }] } } });
    expect(singleProps.showLegend).toBe(false);

    const multipleProps = renderChart({
        data: {
            populations: {
                First: [{ x: '2026-01-01', y: 1 }],
                Second: [{ x: '2026-01-01', y: 2 }],
            },
        },
    });
    expect(multipleProps.showLegend).toBe(true);
});

it('Annotations become markers with Date x values', () => {
    const chartProps = renderChart({
        data: { populations: { Only: [{ x: '2026-01-01', y: 1 }] } },
        annotations: [{ date: '2026-01-05', label: 'Firefox 150' }],
    });

    expect(chartProps.markers).toEqual([{ x: new Date('2026-01-05'), label: 'Firefox 150' }]);
});

it('Axis units and suggested bounds are passed to the chart', () => {
    const chartProps = renderChart({
        data: { populations: { Only: [{ x: '2026-01-01', y: 1 }] } },
        axes: { x: { unit: 'Date' }, y: { unit: '%', suggestedMin: 0, suggestedMax: 100 } },
    });

    expect(chartProps).toMatchObject({ xUnit: 'Date', yUnit: '%', suggestedYMin: 0, suggestedYMax: 100 });
});

it('The chart fills a wide parent, and is square when the parent is 400px or narrower', () => {
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get');
    const data = { populations: { Only: [{ x: '2026-01-01', y: 1 }] } };

    offsetWidth.mockReturnValue(900);
    expect(renderChart({ data })).toMatchObject({ width: 900, height: 400 });

    offsetWidth.mockReturnValue(320);
    expect(renderChart({ data })).toMatchObject({ width: 320, height: 320 });

    offsetWidth.mockReturnValue(100);
    expect(renderChart({ data })).toMatchObject({ width: 264, height: 400 });
});

it('Points with a y value of 0 are kept', () => {
    const chartProps = renderChart({
        data: { populations: { Share: [{ x: '2026-01-01', y: 0 }, { x: '2026-01-08', y: 4 }] } },
    });

    expect(chartProps.data[0].map(point => point.y)).toEqual([0, 4]);
});

it('A population whose points are all null keeps its legend entry and passes an empty series', () => {
    // Pinned as current behavior: nothing is drawn for it, but it still
    // appears in the legend.
    const chartProps = renderChart({
        data: {
            populations: {
                Present: [{ x: '2026-01-01', y: 3 }],
                Missing: [{ x: '2026-01-01', y: null }, { x: '2026-01-08', y: null }],
            },
        },
    });

    expect(chartProps.legend).toEqual(['Present', 'Missing']);
    expect(chartProps.data).toEqual([[{ x: new Date('2026-01-01'), y: 3 }], []]);
});

it('Hovering a legend entry highlights that population, and leaving it clears the highlight', () => {
    const chartProps = renderChart({
        data: { populations: { High: [{ x: '2026-01-01', y: 9 }], Low: [{ x: '2026-01-01', y: 1 }] } },
    });
    expect(chartProps.highlightedPopulation).toBeNull();

    act(() => chartProps.onLegendHover('Low'));
    expect(Chart.mock.calls.at(-1)[0].highlightedPopulation).toBe('Low');

    act(() => chartProps.onLegendHover(null));
    expect(Chart.mock.calls.at(-1)[0].highlightedPopulation).toBeNull();
});

it('Clicking a legend entry hides its population, and clicking again shows and highlights it', () => {
    const chartProps = renderChart({
        data: { populations: { High: [{ x: '2026-01-01', y: 9 }], Low: [{ x: '2026-01-01', y: 1 }] } },
    });
    expect(chartProps.hiddenPopulations).toEqual([]);

    act(() => chartProps.onLegendHover('Low'));
    act(() => chartProps.onLegendToggle('Low'));
    expect(Chart.mock.calls.at(-1)[0]).toMatchObject({ hiddenPopulations: ['Low'], highlightedPopulation: null });

    act(() => chartProps.onLegendToggle('Low'));
    expect(Chart.mock.calls.at(-1)[0]).toMatchObject({ hiddenPopulations: [], highlightedPopulation: 'Low' });
});

it('New data, such as another region\'s, clears hidden and highlighted populations', () => {
    const firstData = { populations: { High: [{ x: '2026-01-01', y: 9 }], Low: [{ x: '2026-01-01', y: 1 }] } };
    const { rerender } = render(
        <div id="application"><main><ChartContainer axes={{}} data={firstData} /></main></div>
    );
    act(() => Chart.mock.calls.at(-1)[0].onLegendToggle('Low'));
    act(() => Chart.mock.calls.at(-1)[0].onLegendHover('High'));
    expect(Chart.mock.calls.at(-1)[0]).toMatchObject({ hiddenPopulations: ['Low'], highlightedPopulation: 'High' });

    const secondData = { populations: { High: [{ x: '2026-01-01', y: 5 }], Low: [{ x: '2026-01-01', y: 2 }] } };
    rerender(<div id="application"><main><ChartContainer axes={{}} data={secondData} /></main></div>);

    expect(Chart.mock.calls.at(-1)[0]).toMatchObject({ hiddenPopulations: [], highlightedPopulation: null });
});
