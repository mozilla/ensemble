import { render, waitFor } from '@testing-library/react';

import SummaryMetric from '../../components/views/SummaryMetric';
import SummaryMetricContainer from '../../components/containers/SummaryMetricContainer';


let fetchMock;

// The real view draws with d3 into a measured parent node.
vi.mock('../../components/views/SummaryMetric', () => ({ default: vi.fn(() => null) }));

function respondWith(body, httpStatus = 200) {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
    }));
}

function renderSummaryMetric() {
    return render(
        <SummaryMetricContainer
            dashboardSource="https://data.example/hardware"
            activeRegion="Worldwide"
            slug="gpu-vendor"
            activeDate="2026-01-04"
        />
    );
}

async function dataPassedToView() {
    await waitFor(() => expect(SummaryMetric).toHaveBeenCalled());
    return SummaryMetric.mock.calls.at(-1)[0].data;
}

beforeEach(() => {
    fetchMock = vi.spyOn(window, 'fetch');
    SummaryMetric.mockClear();
});

it('Requests the summary metric for the active region', async () => {
    respondWith({ title: 'GPU Vendor', data: { populations: { Intel: [{ x: '2026-01-04', y: 100 }] } } });

    renderSummaryMetric();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0].url).toBe('https://data.example/hardware/Worldwide/gpu-vendor/index.json');
});

it('A single population becomes a True/False split at the active date', async () => {
    respondWith({
        title: 'Has Flash',
        data: {
            populations: {
                'Has Flash': [
                    { x: '2026-01-04', y: 30 },
                    { x: '2025-12-28', y: 90 },
                ],
            },
        },
    });

    renderSummaryMetric();

    expect(await dataPassedToView()).toEqual([
        { id: 1, name: 'False', value: 70 },
        { id: 0, name: 'True', value: 30 },
    ]);
});

it('Populations under 5% are summed into "Other", which comes last; the rest are sorted by value', async () => {
    respondWith({
        title: 'GPU Vendor',
        data: {
            populations: {
                Intel: [{ x: '2026-01-04', y: 40 }],
                NVIDIA: [{ x: '2026-01-04', y: 50 }],
                Matrox: [{ x: '2026-01-04', y: 3 }],
                VIA: [{ x: '2026-01-04', y: 1 }],
                AMD: [{ x: '2026-01-04', y: 6 }],
            },
        },
    });

    renderSummaryMetric();

    const data = await dataPassedToView();
    expect(data.map(slice => slice.name)).toEqual(['NVIDIA', 'Intel', 'AMD', 'Other']);
    expect(data.at(-1).value).toBe(4);
});

it('Populations with no data point at the active date are left out', async () => {
    respondWith({
        title: 'GPU Vendor',
        data: {
            populations: {
                Intel: [{ x: '2026-01-04', y: 60 }],
                NVIDIA: [{ x: '2026-01-04', y: 40 }],
                '3dfx': [{ x: '1999-01-04', y: 100 }],
            },
        },
    });

    renderSummaryMetric();

    expect((await dataPassedToView()).map(slice => slice.name)).toEqual(['Intel', 'NVIDIA']);
});

it('When the request fails, #summary-metric-fetch-error is rendered', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    respondWith({ error: 'Internal Server Error' }, 500);

    const { container } = renderSummaryMetric();

    await waitFor(() => expect(container.querySelector('#summary-metric-fetch-error')).toBeInTheDocument());
});
