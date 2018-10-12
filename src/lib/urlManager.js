import querystring from 'querystring';


/**
 * In this class, we operate directly on window.location and window.history. In
 * some ways it would be better to operate on the location and history objects
 * that react-router provides, as we do on Test Tube...
 *
 * https://github.com/mozilla/firefox-test-tube/blob/ea772166d694bd8db07b958ce2ea4b34a97c24aa/src/lib/URLManager.js
 *
 * Unfortunately, the Application component completely re-renders whenever
 * react-router's history.push() is called. This causes the screen to briefly
 * flash white. This also resets the scroll position. This makes it much more
 * difficult for the user to quickly compare charts in different regions.
 *
 * The solution we use here, operating directly on window.location and
 * window.history, does work, but it comes at the cost of other things. For
 * example, when window.location and window.history are directly manipulated,
 * react-router's versions of these objects are not updated.
 *
 * I asked about this on Stack Overflow:
 * https://stackoverflow.com/questions/52562662/add-or-update-query-parameter-using-react-router-v4-without-re-rendering-main-co
 */
export default class {
    /* Get the queryString without the leading question mark */
    static get queryString() {
        return window.location.search.substring(1);
    }

    /**
     * Get the value of a query parameter from the currentl URL. For example, if
     * the URL is...
     *
     * https://data.firefox.com/dashboard/user-activity?region=France
     *
     * then...
     *
     * getQueryParameter('region') => 'France'
     */
    static getQueryParameter(key) {
        return querystring.parse(this.queryString)[key];
    }

    /**
     * Add a query parameter or change a value for an existing query parameter.
     * For example, if the URL is...
     *
     * https://data.firefox.com/dashboard/user-activity?region=France
     *
     * then...
     *
     * setQueryParameter('region', 'India'); setQueryParameter('page', 2) =>
     * https://data.firefox.com/dashboard/user-activity?region=India&page=2
     */
    static setQueryParameter(key, value) {
        const nextURL = window.location.pathname + '?' + querystring.stringify(
            Object.assign(querystring.parse(this.queryString), { [key]: value })
        );
        window.history.pushState({ path: nextURL }, '', nextURL);
    }
}
