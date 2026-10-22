import { render, waitFor } from '@testing-library/react';

import SummaryMetricContainer from '../../components/containers/SummaryMetricContainer';


// react-refetch reads window.fetch when connect() runs at import time, so the
// stub has to exist before the container module loads.
const fetchMock = vi.hoisted(() => {
    const mock = vi.fn();
    window.fetch = mock;
    return mock;
});

const activeDate = '2026-01-04';

// Renders the real summary bar for one population per [name, value] pair, all
// on activeDate. SummaryMetric sizes itself from #application > main, which
// jsdom reports as 0px wide, so the width is stubbed: at 490px the bar is
// drawn at its 450px maximum, leaving 410px for the segments.
async function renderSummaryBar(populationValues) {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(490);
    const populations = Object.fromEntries(populationValues.map(([populationName, value]) => [populationName, [{ x: activeDate, y: value }]]));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ title: 'GPU Vendor', data: { populations } }), {
        headers: { 'Content-Type': 'application/json' },
    }));

    const { container } = render(
        <div id="application">
            <main>
                <SummaryMetricContainer dashboardSource="https://data.example/hardware" activeRegion="default" slug="gpu-vendor" activeDate={activeDate} />
            </main>
        </div>
    );

    await waitFor(() => expect(container.querySelector('rect.bar')).toBeInTheDocument());

    return {
        widths: [...container.querySelectorAll('rect.bar')].map(rect => Number(rect.getAttribute('width'))),
        labels: [...container.querySelectorAll('text.bar-label')].map(label => label.textContent),
        visibleLabels: [...container.querySelectorAll('text.bar-label')].filter(label => label.style.display !== 'none').map(label => label.textContent),
        arrowOpacities: [...container.querySelectorAll('circle.bar-arrow')].map(arrow => arrow.style.opacity),
    };
}

beforeEach(() => {
    fetchMock.mockReset();
});

it('Each population gets a segment sized by its share, largest first, with small ones combined into a final "Other"', async () => {
    const bar = await renderSummaryBar([['AMD', 30], ['Intel', 50], ['VIA', 2], ['NVIDIA', 15], ['Matrox', 3]]);

    expect(bar.labels).toEqual(['Intel (50%)', 'AMD (30%)', 'NVIDIA (15%)', 'Other (5%)']);
    expect(bar.widths).toEqual([205, 123, 61.5, 20.5]);
});

it('Only the largest segment\'s label shows until a segment is hovered or clicked', async () => {
    const bar = await renderSummaryBar([['AMD', 30], ['Intel', 70]]);

    expect(bar.visibleLabels).toEqual(['Intel (70%)']);
});

it('A single population is shown as a True/False split', async () => {
    const bar = await renderSummaryBar([['Has Flash', 80]]);

    expect(bar.labels).toEqual(['True (80%)', 'False (20%)']);
    expect(bar.widths).toEqual([328, 82]);
});

it('Segments under 4% get no arrow, since the arrow would be wider than the segment', async () => {
    const bar = await renderSummaryBar([['Intel', 60], ['AMD', 37], ['VIA', 3]]);

    expect(bar.labels).toEqual(['Intel (60%)', 'AMD (37%)', 'Other (3%)']);
    expect(bar.arrowOpacities).toEqual(['', '', '0']);
});

it('A population at exactly 5% gets its own segment; one just under 5% goes into "Other"', async () => {
    const bar = await renderSummaryBar([['Intel', 60], ['AMD', 30.01], ['VIA', 5], ['Matrox', 4.99]]);

    expect(bar.labels).toEqual(['Intel (60%)', 'AMD (30.010%)', 'VIA (5%)', 'Other (4.990%)']);
});

it('A population at 0% is left out, and no empty "Other" segment is drawn', async () => {
    const bar = await renderSummaryBar([['Intel', 70], ['AMD', 30], ['VIA', 0]]);

    expect(bar.labels).toEqual(['Intel (70%)', 'AMD (30%)']);
    expect(bar.widths).toEqual([287, 123]);
});
