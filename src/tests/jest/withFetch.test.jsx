import { render, screen } from '@testing-library/react';

import withFetch from '../../lib/withFetch';


let fetchMock;
const pendingRequests = {};

function settle(url, body, httpStatus = 200) {
    pendingRequests[url](new Response(JSON.stringify(body), {
        status: httpStatus,
        headers: { 'Content-Type': 'application/json' },
    }));
}

const ShowFetchState = withFetch(props => `https://data.example/${props.slug}.json`)(({ dataFetch }) => {
    if (dataFetch.pending) return <p>pending</p>;
    if (dataFetch.rejected) return <p>rejected: {dataFetch.reason.message}</p>;
    return <p>fulfilled: {dataFetch.value.title}</p>;
});

beforeEach(() => {
    fetchMock = vi.spyOn(window, 'fetch');
    fetchMock.mockImplementation(request => new Promise(resolve => {
        pendingRequests[request.url] = resolve;
    }));
});

it('Is pending until the response arrives, then passes the parsed JSON', async () => {
    render(<ShowFetchState slug="one" />);
    expect(screen.getByText('pending')).toBeInTheDocument();

    settle('https://data.example/one.json', { title: 'One' });

    expect(await screen.findByText('fulfilled: One')).toBeInTheDocument();
});

it('Requests once per URL and refetches, pending again, only when the URL changes', async () => {
    const { rerender } = render(<ShowFetchState slug="one" unrelated="a" />);
    settle('https://data.example/one.json', { title: 'One' });
    await screen.findByText('fulfilled: One');

    rerender(<ShowFetchState slug="one" unrelated="b" />);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender(<ShowFetchState slug="two" unrelated="b" />);
    expect(await screen.findByText('pending')).toBeInTheDocument();
    expect(fetchMock.mock.calls.map(([request]) => request.url)).toEqual([
        'https://data.example/one.json',
        'https://data.example/two.json',
    ]);
});

it('Rejects a non-2xx response with the message from its JSON body', async () => {
    render(<ShowFetchState slug="one" />);

    settle('https://data.example/one.json', { error: 'Metric not found' }, 500);

    expect(await screen.findByText('rejected: Metric not found')).toBeInTheDocument();
});

it('Ignores a response that arrives after a newer request has started', async () => {
    const { rerender } = render(<ShowFetchState slug="slow" />);
    rerender(<ShowFetchState slug="fast" />);

    settle('https://data.example/fast.json', { title: 'Fast' });
    await screen.findByText('fulfilled: Fast');
    settle('https://data.example/slow.json', { title: 'Slow' });

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(screen.getByText('fulfilled: Fast')).toBeInTheDocument();
});
