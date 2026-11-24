import { initPlausible } from '../../lib/measure';


const scriptUrl = 'https://pa.firefox.com/js/pa-example.js';

function setPrivacySignals({ globalPrivacyControl, navigatorDoNotTrack, windowDoNotTrack } = {}) {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: globalPrivacyControl, configurable: true });
    Object.defineProperty(navigator, 'doNotTrack', { value: navigatorDoNotTrack, configurable: true });
    Object.defineProperty(window, 'doNotTrack', { value: windowDoNotTrack, configurable: true });
}

beforeEach(() => {
    setPrivacySignals();
    delete window.plausible;
    document.head.innerHTML = '';
});

it('Loads the script from the given URL and sends events to pa.firefox.com', () => {
    initPlausible(scriptUrl);

    const script = document.querySelector('script');
    expect(script.src).toBe(scriptUrl);
    expect(script.async).toBe(true);
    expect(window.plausible.o).toEqual({ endpoint: 'https://pa.firefox.com/api/event' });
});

it('Queues calls made before the script loads', () => {
    initPlausible(scriptUrl);

    window.plausible('pageview');

    expect(window.plausible.q).toHaveLength(1);
    expect([...window.plausible.q[0]]).toEqual(['pageview']);
});

it('Adds the script only once', () => {
    initPlausible(scriptUrl);
    initPlausible(scriptUrl);

    expect(document.querySelectorAll('script')).toHaveLength(1);
});

it('Does nothing without a script URL', () => {
    initPlausible('');

    expect(document.querySelector('script')).toBeNull();
    expect(window.plausible).toBeUndefined();
});

it.each([
    ['without a scheme', 'pa.firefox.com/js/pa-example.js'],
    ['a path only', '/js/pa-example.js'],
    ['on another origin', 'https://example.com/js/pa-example.js'],
    ['on a lookalike origin', 'https://pa.firefox.com.example.com/js/pa-example.js'],
    ['over plain HTTP', 'http://pa.firefox.com/js/pa-example.js'],
    ['not a per-site script', 'https://pa.firefox.com/js/script.js'],
    ['carrying a query string', 'https://pa.firefox.com/js/pa-example.js?x=1'],
])('Warns and loads nothing, without throwing, for a script URL that is %s', (description, badUrl) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => initPlausible(badUrl)).not.toThrow();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining(badUrl));
    expect(document.querySelector('script')).toBeNull();
    expect(window.plausible).toBeUndefined();
});

it.each([
    ['Global Privacy Control', { globalPrivacyControl: true }],
    ['Do Not Track on navigator', { navigatorDoNotTrack: '1' }],
    ['Do Not Track on navigator, spelled yes', { navigatorDoNotTrack: 'yes' }],
    ['Do Not Track on window', { windowDoNotTrack: '1' }],
    ['Do Not Track on window while navigator says unspecified', { navigatorDoNotTrack: 'unspecified', windowDoNotTrack: '1' }],
])('Does nothing when %s is on', (signal, signals) => {
    setPrivacySignals(signals);

    initPlausible(scriptUrl);

    expect(document.querySelector('script')).toBeNull();
    expect(window.plausible).toBeUndefined();
});

it('Loads when the privacy signals are explicitly off', () => {
    setPrivacySignals({ globalPrivacyControl: false, navigatorDoNotTrack: '0', windowDoNotTrack: '0' });

    initPlausible(scriptUrl);

    expect(document.querySelector('script')).not.toBeNull();
});
