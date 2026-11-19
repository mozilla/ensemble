import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router';
import ReactGA from 'react-ga4';


vi.mock('react-ga4', () => ({
    default: { initialize: vi.fn(), send: vi.fn() },
}));

// withTracker reads the ID and initialises analytics when it is imported, so
// each test imports a fresh copy after setting the ID.
async function renderTracked(measurementId, path = '/contact') {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', measurementId);
    vi.resetModules();
    const { default: withTracker } = await import('../../components/decorators/withTracker');
    const Page = withTracker(() => <Link to="/dashboard/hardware?x=1">next</Link>);
    render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    await screen.findByText('next');
}

beforeEach(() => {
    ReactGA.initialize.mockClear();
    ReactGA.send.mockClear();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

it.each(['G-XXXXXXXXXX', ''])('Loads no analytics and sends nothing for the measurement ID %j', async measurementId => {
    await renderTracked(measurementId);

    expect(ReactGA.initialize).not.toHaveBeenCalled();
    expect(ReactGA.send).not.toHaveBeenCalled();
});

it('With a real ID, initialises straight away, before sending the first page view', async () => {
    await renderTracked('G-TEST000000');

    expect(ReactGA.initialize).toHaveBeenCalledWith('G-TEST000000', { gtagOptions: { send_page_view: false } });
    expect(ReactGA.send).toHaveBeenCalledWith({
        hitType: 'pageview',
        page: '/contact',
        location: `${window.location.origin}/contact`,
    });
    expect(ReactGA.initialize.mock.invocationCallOrder[0]).toBeLessThan(ReactGA.send.mock.invocationCallOrder[0]);
});

it('Each page view carries the address of its own page, even when sent before gtag has loaded', async () => {
    await renderTracked('G-TEST000000');
    fireEvent.click(screen.getByText('next'));

    expect(ReactGA.send.mock.calls.map(([hit]) => [hit.page, hit.location])).toEqual([
        ['/contact', `${window.location.origin}/contact`],
        ['/dashboard/hardware', `${window.location.origin}/dashboard/hardware?x=1`],
    ]);
});
