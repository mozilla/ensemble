import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';

import DashboardContainer from '../../components/containers/DashboardContainer';


let fetchMock;

const source = 'https://data.example/user-activity';

function jsonResponse(body, httpStatus = 200) {
    return Promise.resolve(new Response(JSON.stringify(body), {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
    }));
}

// Answers the dashboard index with `dashboard` and leaves every metric request
// pending, so only the dashboard's own markup renders.
function serveDashboard(dashboard) {
    fetchMock.mockImplementation(request => {
        if (request.url === `${source}/index.json`) return jsonResponse(dashboard);
        return new Promise(() => {});
    });
}

function requestedUrls() {
    return fetchMock.mock.calls.map(([request]) => request.url);
}

const multiRegionDashboard = {
    title: 'User Activity',
    metrics: ['daily-usage'],
    dates: ['2026-01-04'],
    categories: ['Worldwide', 'Germany', 'Brazil'],
    defaultCategory: 'Worldwide',
};

beforeEach(() => {
    fetchMock = vi.spyOn(window, 'fetch');
});

it('Requests the dashboard index from its source and shows a spinner while waiting', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });

    expect(container.querySelector('.spinner')).toBeInTheDocument();
    await waitFor(() => expect(requestedUrls()).toEqual([`${source}/index.json`]));
});

it('When the request fails, #dashboard-fetch-error is rendered', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockImplementation(() => jsonResponse({ error: 'Internal Server Error' }, 500));

    const { container } = render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });

    await waitFor(() => expect(container.querySelector('#dashboard-fetch-error')).toBeInTheDocument());
});

it('When the request succeeds, the dashboard renders and metrics load for the default region', async () => {
    serveDashboard(multiRegionDashboard);

    const { container } = render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });

    await waitFor(() => expect(container.querySelector('#dashboard-title')).toHaveTextContent('User Activity'));
    expect(screen.getByLabelText('Region')).toHaveValue('Worldwide');
    await waitFor(() => expect(requestedUrls()).toContain(`${source}/Worldwide/daily-usage/index.json`));
});

it('A preferred region saved in sessionStorage is used instead of the default', async () => {
    sessionStorage.setItem('preferredRegion', 'Brazil');
    serveDashboard(multiRegionDashboard);

    render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });

    await waitFor(() => expect(screen.getByLabelText('Region')).toHaveValue('Brazil'));
    await waitFor(() => expect(requestedUrls()).toContain(`${source}/Brazil/daily-usage/index.json`));
});

it('Choosing a region saves it to sessionStorage and loads metrics for it', async () => {
    const user = userEvent.setup();
    serveDashboard(multiRegionDashboard);
    render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });
    await screen.findByLabelText('Region');

    await user.selectOptions(screen.getByLabelText('Region'), 'Germany');

    expect(sessionStorage.getItem('preferredRegion')).toBe('Germany');
    expect(screen.getByLabelText('Region')).toHaveValue('Germany');
    await waitFor(() => expect(requestedUrls()).toContain(`${source}/Germany/daily-usage/index.json`));
});

it('A dashboard with one region shows no region selector and ignores the saved preference', async () => {
    sessionStorage.setItem('preferredRegion', 'Brazil');
    serveDashboard({
        title: 'Hardware',
        metrics: ['gpu-vendor'],
        dates: ['2026-01-04'],
        categories: ['default'],
    });

    const { container } = render(<DashboardContainer source={source} />, { wrapper: HelmetProvider });

    await waitFor(() => expect(container.querySelector('#dashboard-title')).toHaveTextContent('Hardware'));
    expect(container.querySelector('#region-selector')).toBeNull();
    await waitFor(() => expect(requestedUrls()).toContain(`${source}/default/gpu-vendor/index.json`));
});
