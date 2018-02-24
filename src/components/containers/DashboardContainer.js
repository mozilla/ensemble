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

            // TODO: Remove this all when Ensemble launches
            if (dataFetch.reason instanceof TypeError) {
                if (this.props.match.params.key === 'usage') {
                    return (
                        <p>
                            The Usage dashboard is not currently public. Contact
                            John Karahalis for a screenshot or for help setting up a
                            demo on your local computer.
                        </p>
                    );
                }
            }

            return <Error message={dataFetch.reason.message} />;
        } else if (dataFetch.fulfilled) {
            return (
                <Dashboard
                    title={dataFetch.value.title}
                    description={dataFetch.value.description}
                    sections={dataFetch.value.sections}
                    charts={dataFetch.value.charts}
                    categories={dataFetch.value.categories}
                    activeCategory={this.state.activeCategory || dataFetch.value.categories[0]}
                    onCategoryChange={this._onCategoryChange}
                />
            );
        }
    }
};

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
