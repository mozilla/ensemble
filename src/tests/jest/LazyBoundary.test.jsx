import { render, screen } from '@testing-library/react';

import LazyBoundary from '../../lib/LazyBoundary';
import lazyLoad from '../../lib/lazyLoad';


it('Shows a spinner while a lazily loaded component is loading', () => {
    const NeverLoads = lazyLoad(new Promise(() => {}));

    const { container } = render(
        <LazyBoundary>
            <NeverLoads />
        </LazyBoundary>
    );

    expect(container.querySelector('.spinner')).toBeInTheDocument();
});

it('Shows the loaded component once it arrives', async () => {
    const Loads = lazyLoad(Promise.resolve({ default: () => <p>Loaded</p> }));

    render(
        <LazyBoundary>
            <Loads />
        </LazyBoundary>
    );

    expect(await screen.findByText('Loaded')).toBeInTheDocument();
});

it('Shows "Load error" when loading fails', async () => {
    // React logs errors caught by an error boundary.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const FailsToLoad = lazyLoad(Promise.reject(new Error('Failed to fetch dynamically imported module')));

    render(
        <LazyBoundary>
            <FailsToLoad />
        </LazyBoundary>
    );

    expect(await screen.findByText('Load error')).toBeInTheDocument();
});
