import React from 'react';
import Spinner from 'react-spinkit';
import { connect } from 'react-refetch';

import Error from '../views/Error';
import Dashboard from '../views/Dashboard';

import './css/Spinner.css';


const DashboardContainer = props => {
    const dataFetch = props.dataFetch;

    if (dataFetch.pending) {
        return <Spinner name="circle" fadeIn="none" />;
    } else if (dataFetch.rejected) {

        // TODO: Remove this all when Ensemble launches
        if (dataFetch.reason instanceof TypeError) {
            if (props.match.params.key === 'usage') {
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
            />
        );
    }
};

export default connect(props => ({
    dataFetch: { url: props.source },
}))(DashboardContainer);
