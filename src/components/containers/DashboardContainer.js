import React from 'react';
import { connect } from 'react-refetch';

import Loading from '../views/Loading';
import Error from '../views/Error';
import Dashboard from '../views/Dashboard';


const DashboardContainer = props => {
    const dataFetch = props.dataFetch;

    if (dataFetch.pending) {
        return <Loading />;
    } else if (dataFetch.rejected) {
        return <Error message={dataFetch.reason.message} />;
    } else if (dataFetch.fulfilled) {
        console.dir(dataFetch.value);
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
    dataFetch: { url: props.dataURL, refreshInterval: Number(process.env.REACT_APP_REFRESH_INTERVAL) },
}))(DashboardContainer);
