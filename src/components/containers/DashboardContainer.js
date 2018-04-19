import React from 'react';
import Spinner from 'react-spinkit';
import request from 'request';

import Error from '../views/Error';
import Dashboard from '../views/Dashboard';

import './css/Spinner.css';


export default class extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeCategory: null,
            fetchStatus: 'pending', // Because we're about to do a request
            dashboard: {},
        };

        request(props.source, (error, response, body) => {
            if (error) {
                return this.setState({ fetchStatus: 'error' });
            }

            this.setState({
                fetchStatus: 'success',
                dashboard: JSON.parse(body),
            });
        });
    }

    _onCategoryChange = e => {
        this.setState({
            activeCategory: e.target.value,
        });
    }

    render() {
        if (this.state.fetchStatus === 'pending') {
            return <Spinner name="circle" fadeIn="none" />;
        } else if (this.state.fetchStatus === 'error') {
            return (
                <Error
                    id="dashboard-fetch-error"
                    title="Error fetching dashboard"
                />
            );
        } else if (this.state.fetchStatus === 'success') {
            const dashboard = this.state.dashboard;
            const activeCategory = this.state.activeCategory || dashboard.defaultCategory || dashboard.categories[0];

            return (
                <Dashboard
                    title={dashboard.title}
                    description={dashboard.description}
                    sections={dashboard.sections}
                    metrics={dashboard.metrics}
                    summaryMetrics={dashboard.summaryMetrics}
                    categories={dashboard.categories}
                    activeCategory={activeCategory}
                    onCategoryChange={this._onCategoryChange}
                />
            );
        }
    }
}
