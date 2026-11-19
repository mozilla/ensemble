import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ReactGA from 'react-ga4';


vi.mock('react-ga4', () => ({
    default: { initialize: vi.fn(), send: vi.fn() },
}));

// withTracker reads the ID and starts loading analytics when it is imported,
// so each test imports a fresh copy after setting things up.
async function renderTracked(measurementId, path = '/contact') {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', measurementId);
    vi.resetModules();
    const { default: withTracker } = await import('../../components/decorators/withTracker');
    const Page = withTracker(() => <p>page</p>);
    render(<MemoryRouter initialEntries={[path]}><Page /></MemoryRouter>);
    await screen.findByText('page');
}

const flush = () => new Promise(resolve => setTimeout(resolve));

beforeEach(() => {
    ReactGA.initialize.mockClear();
    ReactGA.send.mockClear();
});

afterEach(() => {
    vi.unstubAllEnvs();
});

it.each(['G-XXXXXXXXXX', ''])('Loads no analytics and sends nothing for the measurement ID %j', async measurementId => {
    await renderTracked(measurementId);
    await flush();

    expect(ReactGA.initialize).not.toHaveBeenCalled();
    expect(ReactGA.send).not.toHaveBeenCalled();
});

it('With a real ID, initialises once the page has loaded, then sends the page view', async () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    await renderTracked('G-TEST000000');
    await flush();

    expect(ReactGA.initialize).not.toHaveBeenCalled();
    expect(ReactGA.send).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('load'));
    await flush();

    expect(ReactGA.initialize).toHaveBeenCalledWith('G-TEST000000', { gtagOptions: { send_page_view: false } });
    expect(ReactGA.send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/contact' });
    expect(ReactGA.initialize.mock.invocationCallOrder[0]).toBeLessThan(ReactGA.send.mock.invocationCallOrder[0]);
});

it('With a real ID, initialises straight away when the page has already loaded', async () => {
    await renderTracked('G-TEST000000', '/');
    await flush();

    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
    expect(ReactGA.send).toHaveBeenCalledWith({ hitType: 'pageview', page: '/' });
});
