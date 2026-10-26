import React from 'react';


const pendingState = { pending: true, rejected: false, fulfilled: false };

async function fetchJSON(url) {
    const response = await window.fetch(new Request(url, {
        credentials: 'same-origin',
        mode: 'cors',
    }));

    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return undefined;
    }

    const body = await response.json();

    if (!response.ok) {
        throw new Error(body.error || body.message || response.statusText);
    }

    return body;
}

/**
 * Fetch JSON from the URL that mapPropsToUrl returns and pass the request's
 * state to the wrapped component as `dataFetch`: { pending, rejected,
 * fulfilled, value, reason }. Refetches whenever the URL changes, going back to
 * pending first, and ignores any response that arrives after a newer request
 * has started.
 */
export default mapPropsToUrl => WrappedComponent => class extends React.Component {
    constructor(props) {
        super(props);
        this.state = { dataFetch: pendingState };
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

        if (this.state.dataFetch !== pendingState) {
            this.setState({ dataFetch: pendingState });
        }

        fetchJSON(url).then(
            value => {
                if (isCurrent()) {
                    this.setState({ dataFetch: { pending: false, rejected: false, fulfilled: true, value } });
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
