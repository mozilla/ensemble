import React from 'react';
import { connect } from 'react-refetch';

import Loading from './Loading';
import Error from './Error';


const Dashboard = props => {
    const dataFetch = props.dataFetch;

    if (dataFetch.pending) {
        return <Loading />;
    } else if (dataFetch.rejected) {
        return <Error message={dataFetch.reason.message} />;
    } else if (dataFetch.fulfilled) {
        return null;
    }
};

export default connect(props => ({
    dataFetch: { url: props.dataURL, refreshInterval: Number(process.env.REACT_APP_REFRESH_INTERVAL) },
}))(Dashboard);
