import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import reactGA from 'react-ga';

import Application from '../../components/views/Application';
import { dashboards } from '../../config.json';


// react-refetch reads window.fetch when connect() runs at import time, so the
// stub has to exist before any container module loads.
const fetchMock = vi.hoisted(() => {
    const mock = vi.fn();
    window.fetch = mock;
    return mock;
});

vi.mock('react-ga', () => ({
    default: { initialize: vi.fn(), set: vi.fn(), pageview: vi.fn() },
}));

function renderAt(path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Application />
        </MemoryRouter>
    );
}

beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    reactGA.pageview.mockClear();
});

it('/ shows the introduction and a button to the first dashboard', async () => {
    const { container } = renderAt('/');

    expect(await screen.findByRole('link', { name: 'Proceed to User Activity' })).toHaveAttribute('href', '/dashboard/user-activity');
    expect(container.querySelector('#introduction')).toBeInTheDocument();
});

it('/contact shows the contact page', async () => {
    const { container } = renderAt('/contact');

    await screen.findByText(/questions/i, { selector: '#contact' });
    expect(container.querySelector('#not-found')).toBeNull();
});

it.each(dashboards)('/dashboard/$key requests its index from $source', async ({ key, source }) => {
    const { container } = renderAt(`/dashboard/${key}`);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0].url).toBe(`${source}/index.json`);
    expect(container.querySelector('#not-found')).toBeNull();
});

it.each([
    '/not-a-page',
    '/dashboard/not-a-dashboard',
    '/dashboard/hardware/extra',
    '/contact/extra',
])('%s shows Not Found', async path => {
    const { container } = renderAt(path);

    await vi.waitFor(() => expect(container.querySelector('#not-found')).toBeInTheDocument());
});

it('Each page sends a pageview for its path', async () => {
    renderAt('/contact');

    await vi.waitFor(() => expect(reactGA.pageview).toHaveBeenCalledWith('/contact'));
});

it('The header links to every dashboard in config.json and the contact page', () => {
    const { container } = renderAt('/');

    const links = [...container.querySelectorAll('#main-navigation a')].map(link => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
        ...dashboards.map(dashboard => [dashboard.menuTitle, `/dashboard/${dashboard.key}`]),
        ['Contact', '/contact'],
    ]);
});
