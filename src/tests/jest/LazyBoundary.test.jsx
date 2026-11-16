import { render, screen } from '@testing-library/react';

import LazyBoundary from '../../lib/LazyBoundary';
import lazyLoad from '../../lib/lazyLoad';


function renderInBoundary(ui) {
    return render(<LazyBoundary>{ui}</LazyBoundary>);
}

it('Shows a spinner while a lazily loaded component is loading', () => {
    const NeverLoads = lazyLoad(() => new Promise(() => {}));

    const { container } = renderInBoundary(<NeverLoads />);

    expect(container.querySelector('.spinner')).toBeInTheDocument();
});

it('Shows the loaded component once it arrives', async () => {
    const Loads = lazyLoad(() => Promise.resolve({ default: () => <p>Loaded</p> }));

    renderInBoundary(<Loads />);

    expect(await screen.findByText('Loaded')).toBeInTheDocument();
});

it('A component whose code loaded before it is first rendered shows on that first render, with no spinner', async () => {
    let resolveLoad;
    const LoadsFirst = lazyLoad(() => new Promise(resolve => {
        resolveLoad = resolve;
    }));
    resolveLoad({ default: () => <p>Loaded</p> });
    await Promise.resolve();
    await Promise.resolve();

    const { container } = renderInBoundary(<LoadsFirst />);

    expect(screen.getByText('Loaded')).toBeInTheDocument();
    expect(container.querySelector('.spinner')).toBeNull();
});

it('A component shown before shows again straight away when it is mounted again', async () => {
    const Loads = lazyLoad(() => Promise.resolve({ default: () => <p>Loaded</p> }));
    const first = renderInBoundary(<Loads />);
    await screen.findByText('Loaded');
    first.unmount();

    const { container } = renderInBoundary(<Loads />);

    expect(screen.getByText('Loaded')).toBeInTheDocument();
    expect(container.querySelector('.spinner')).toBeNull();
});

it('When loading fails, shows "Load error" and a reload button, and never loads again', async () => {
    // React logs errors caught by an error boundary.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const loader = vi.fn(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));
    const FailsToLoad = lazyLoad(loader);

    const first = renderInBoundary(<><FailsToLoad /><FailsToLoad /></>);
    expect(await screen.findByText('Load error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
    first.unmount();

    renderInBoundary(<FailsToLoad />);
    expect(await screen.findByText('Load error')).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(1);
});
