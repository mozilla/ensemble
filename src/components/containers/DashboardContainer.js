import React from 'react';
import Spinner from 'react-spinkit';
import { connect } from 'react-refetch';

import Error from '../views/Error';
import Dashboard from '../views/Dashboard';

import './css/Spinner.css';


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
            return <Spinner name="circle" fadeIn="none" />;
        } else if (dataFetch.rejected) {
            const extraErrorProps = {};

            if (dataFetch.reason && dataFetch.reason.message) {
                extraErrorProps.message = dataFetch.reason.message;
            }

            return (
                <Error
                    id="dashboard-fetch-error"
                    title="Error fetching dashboard"
                    {...extraErrorProps}
                />
            );
        } else if (dataFetch.fulfilled) {
            const activeCategory = this.state.activeCategory || dataFetch.value.defaultCategory || dataFetch.value.categories[0];
            return (
                <Dashboard
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    sections={dataFetch.value.sections}
                    metrics={dataFetch.value.metrics}
                    summaryMetrics={dataFetch.value.summaryMetrics}
                    categories={dataFetch.value.categories}
                    activeCategory={activeCategory}
                    onCategoryChange={this._onCategoryChange}
                />
            );
        }
    }
}

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
