import React from 'react';
import Spinner from 'react-spinkit';
import { connect } from 'react-refetch';

import Error from '../viewRouters/Error';
import Dashboard from '../viewRouters/Dashboard';

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

            // TODO: Remove this all when Ensemble launches
            if (dataFetch.reason instanceof TypeError) {
                if (this.props.match.params.key === 'usage') {
                    const privateUsageURL = 'https://metrics.mozilla.com/protected/usage-report-demo/dashboard/usage';
                    return (
                        <p>
                            The usage dashboard is not currently public and
                            cannot be shown here. Visit the <a
                            href={privateUsageURL}>private demo</a> to see it.
                            You will need to log in with your LDAP credentials.
                        </p>
                    );
                } else if (this.props.match.params.key === 'health') {
                    const privateHealthURL = 'https://metrics.mozilla.com/protected/usage-report-demo/dashboard/health';
                    return (
                        <p>
                            The health dashboard is not currently public and
                            cannot be shown here. Visit the <a
                            href={privateHealthURL}>private demo</a> to see it.
                            You will need to log in with your LDAP credentials.
                        </p>
                    );
                }
            }

            return <Error message={dataFetch.reason.message} />;
        } else if (dataFetch.fulfilled) {
            const activeCategory = this.state.activeCategory || dataFetch.value.defaultCategory || dataFetch.value.categories[0];
            return (
                <Dashboard
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    sections={dataFetch.value.sections}
                    charts={dataFetch.value.charts}
                    categories={dataFetch.value.categories}
                    activeCategory={activeCategory}
                    onCategoryChange={this._onCategoryChange}
                />
            );
        }
    }
};

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
