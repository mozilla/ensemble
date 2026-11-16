import { act, render, screen } from '@testing-library/react';

import Spinner from '../../components/views/Spinner';


beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

it('With a label, an empty status region is there from the start and announces the label when the dots appear', () => {
    render(<Spinner label="Loading dashboard" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByRole('status')).toHaveTextContent('Loading dashboard');
});

it('Without a label, there is nothing for a screen reader to announce', () => {
    render(<Spinner />);

    act(() => vi.advanceTimersByTime(1000));

    expect(screen.queryByRole('status')).toBeNull();
});
