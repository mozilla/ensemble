import React from 'react';
import { connect } from 'react-refetch';

import Spinner from '../views/Spinner';
import ErrorComponent from '../views/Error';
import Dashboard from '../views/Dashboard';
import URLManager from '../../lib/urlManager';


class DashboardContainer extends React.Component {
    constructor(props) {
        super(props);

        // Only apply a region that is set as a query parameter. Session storage
        // also records preferred regions, but the presence of a region in
        // session storage should not be seen as a sign that the region needs to
        // be applied to this dashboard.
        const activeRegion = URLManager.getQueryParameter('region');
        this.state = { activeRegion };
    }

    _onRegionChange = e => {
        const newRegion = e.target.value;

        // Record the query paramater in the URL so that users can bookmark the
        // dashboard at this region or send others a link to the dashboard at
        // this region
        URLManager.setQueryParameter('region', newRegion);

        // Record the region in session storage as well.
        //
        // Pages that do not support regions do not get a ?region query
        // paramater so as to avoid confusion. But we still need a way to
        // remember the user's preferred region so that it can be used when the
        // user returns to a page that does support regions.
        sessionStorage.setItem('region', newRegion);

        // Dispatch a custom event which other components can listen for if they
        // need to respond to region changes
        const root = document.getElementById('root');
        const regionChangedEvent = document.createEvent('Event');
        regionChangedEvent.initEvent('regionChanged', true, true);
        root.dispatchEvent(regionChangedEvent);

        this.setState({ activeRegion: newRegion });
    }

    render() {
        const dataFetch = this.props.dataFetch;

        if (dataFetch.pending) {
            return <Spinner />;
        } else if (dataFetch.rejected) {
            if (dataFetch.reason && dataFetch.reason.message) {
                // eslint-disable-next-line no-console
                console.error(dataFetch.reason.message);
            }

            return (
                <ErrorComponent
                    id="dashboard-fetch-error"
                    title="Error fetching dashboard"
                />
            );
        } else if (dataFetch.fulfilled) {
            let activeRegion;
            if (dataFetch.value.categories.includes(this.state.activeRegion)) {
                activeRegion = this.state.activeRegion;
            } else if (dataFetch.value.defaultCategory) {
                activeRegion = dataFetch.value.defaultCategory;
            } else {
                activeRegion = dataFetch.value.categories[0];
            }

            return (
                <Dashboard
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    sections={dataFetch.value.sections}
                    dates={dataFetch.value.dates}
                    metrics={dataFetch.value.metrics}
                    summaryMetrics={dataFetch.value.summaryMetrics}
                    regions={dataFetch.value.categories}
                    activeRegion={activeRegion}
                    dashboardSource={this.props.source}
                    onRegionChange={this._onRegionChange}
                />
            );
        }
    }
}

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
