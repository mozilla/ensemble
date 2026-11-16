import React from 'react';

import fetchCache from './fetchCache';


const pendingState = { pending: true, rejected: false, fulfilled: false };

async function fetchJSON(url) {
    const response = await window.fetch(new Request(url, {
        credentials: 'same-origin',
        mode: 'cors',
    }));

    if (!response.ok) {
        // An error response may have no body, or one that isn't JSON (Cloud
        // Storage answers a missing file with XML), and HTTP/2 responses have
        // no statusText.
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || body?.message || response.statusText || `HTTP ${response.status}`);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined;
    }

    return response.json();
}

// Start fetching url, or join the request already made for it. The entry fills
// in its value when the response arrives, whoever is still waiting for it. A
// failed request is forgotten, so the next component to ask tries again.
function cachedFetch(url) {
    if (!fetchCache.has(url)) {
        const entry = { fulfilled: false, value: undefined };
        entry.promise = fetchJSON(url).then(
            value => {
                Object.assign(entry, { fulfilled: true, value });
                return value;
            },
            reason => {
                fetchCache.delete(url);
                throw reason;
            }
        );
        fetchCache.set(url, entry);
    }
    return fetchCache.get(url);
}

function fulfilledState(value) {
    return { pending: false, rejected: false, fulfilled: true, value };
}

/**
 * Fetch JSON from the URL that mapPropsToUrl returns and pass the request's
 * state to the wrapped component as `dataFetch`: { pending, rejected,
 * fulfilled, value, reason }. Refetches whenever the URL changes, going back to
 * pending first, and ignores any response that arrives after a newer request
 * has started.
 *
 * Responses are kept until the page reloads, so a URL fetched before is
 * fulfilled from the first render, and components asking for the same URL at
 * once share one request. The data changes weekly, so a reload is fresh enough.
 */
export default mapPropsToUrl => WrappedComponent => class extends React.Component {
    constructor(props) {
        super(props);
        const cached = fetchCache.get(mapPropsToUrl(props));
        this.state = { dataFetch: cached?.fulfilled ? fulfilledState(cached.value) : pendingState };
        this._latestRequest = 0;
    }

    componentDidMount() {
        this._fetch(mapPropsToUrl(this.props));
    }

    componentDidUpdate() {
        const url = mapPropsToUrl(this.props);
        if (url !== this._url) {
            this._fetch(url);
        }
    }

    componentWillUnmount() {
        this._latestRequest++;
    }

    _fetch(url) {
        this._url = url;
        const request = ++this._latestRequest;
        const isCurrent = () => request === this._latestRequest;
        const entry = cachedFetch(url);

        if (entry.fulfilled) {
            if (this.state.dataFetch.value !== entry.value) {
                this.setState({ dataFetch: fulfilledState(entry.value) });
            }
            return;
        }

        if (this.state.dataFetch !== pendingState) {
            this.setState({ dataFetch: pendingState });
        }

        entry.promise.then(
            value => {
                if (isCurrent()) {
                    this.setState({ dataFetch: fulfilledState(value) });
                }
            },
            reason => {
                if (isCurrent()) {
                    this.setState({ dataFetch: { pending: false, rejected: true, fulfilled: false, reason } });
                }
            }
        );
    }

    render() {
        return <WrappedComponent {...this.props} dataFetch={this.state.dataFetch} />;
    }
};
