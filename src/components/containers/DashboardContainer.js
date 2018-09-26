import React from 'react';
import { connect } from 'react-refetch';

import Spinner from '../views/Spinner';
import ErrorComponent from '../views/Error';
import Dashboard from '../views/Dashboard';


class DashboardContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = { activeCategory: null };
    }

    _onCategoryChange = e => {
        this.setState({
            activeCategory: e.target.value,
        });
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
            const activeCategory = this.state.activeCategory || dataFetch.value.defaultCategory || dataFetch.value.categories[0];
            return (
                <Dashboard
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    sections={dataFetch.value.sections}
                    dates={dataFetch.value.dates}
                    metrics={dataFetch.value.metrics}
                    summaryMetrics={dataFetch.value.summaryMetrics}
                    categories={dataFetch.value.categories}
                    activeCategory={activeCategory}
                    dashboardSource={this.props.source}
                    onCategoryChange={this._onCategoryChange}
                />
            );
        }
    }
}

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
