import { render, screen, waitFor } from '@testing-library/react';

import MetricOverviewContainer from '../../components/containers/MetricOverviewContainer';


// react-refetch reads window.fetch when connect() runs at import time, so the
// stub has to exist before the container module loads.
const fetchMock = vi.hoisted(() => {
    const mock = vi.fn();
    window.fetch = mock;
    return mock;
});

const pendingRequests = {};

// Each URL gets a request the test settles itself, so it can look at the page
// while a request is still in flight.
function settle(url, body, httpStatus = 200) {
    pendingRequests[url](new Response(JSON.stringify(body), {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
    }));
}

function renderForRegion(activeRegion, rerender) {
    const element = (
        <MetricOverviewContainer
            dashboardSource="https://data.example/user-activity"
            activeRegion={activeRegion}
            slug="daily-usage"
            identifier="metric-overview-1"
        />
    );

    return rerender ? rerender(element) : render(element);
}

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(request => new Promise(resolve => {
        pendingRequests[request.url] = resolve;
    }));
});

it('Requests the metric for the dashboard source, region, and slug', async () => {
    renderForRegion('Worldwide');

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0].url).toBe('https://data.example/user-activity/Worldwide/daily-usage/index.json');
});

it('When the request succeeds, the metric title is rendered', async () => {
    renderForRegion('Worldwide');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    settle('https://data.example/user-activity/Worldwide/daily-usage/index.json', { title: 'Daily Usage' });

    expect(await screen.findByText('Daily Usage')).toBeInTheDocument();
});

it('When the first request fails, #metric-overview-fetch-error is rendered', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = renderForRegion('Worldwide');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    settle('https://data.example/user-activity/Worldwide/daily-usage/index.json', { error: 'Internal Server Error' }, 500);

    await waitFor(() => expect(container.querySelector('#metric-overview-fetch-error')).toBeInTheDocument());
});

it('While a new region loads, the previous region\'s metric stays on screen', async () => {
    const { rerender, container } = renderForRegion('Worldwide');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    settle('https://data.example/user-activity/Worldwide/daily-usage/index.json', { title: 'Daily Usage' });
    await screen.findByText('Daily Usage');

    renderForRegion('Germany', rerender);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    expect(screen.getByText('Daily Usage')).toBeInTheDocument();
    expect(container.querySelector('#metric-overview-fetch-error')).toBeNull();
});

it('When the request for a new region fails, #metric-overview-fetch-error replaces the previous metric', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender, container } = renderForRegion('Worldwide');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    settle('https://data.example/user-activity/Worldwide/daily-usage/index.json', { title: 'Daily Usage' });
    await screen.findByText('Daily Usage');

    renderForRegion('Germany', rerender);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    settle('https://data.example/user-activity/Germany/daily-usage/index.json', { error: 'Internal Server Error' }, 500);

    await waitFor(() => expect(container.querySelector('#metric-overview-fetch-error')).toBeInTheDocument());
    expect(screen.queryByText('Daily Usage')).toBeNull();
});
