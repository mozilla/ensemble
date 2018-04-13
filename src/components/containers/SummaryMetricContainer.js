import React from 'react';

import SummaryMetric from '../views/SummaryMetric';


export default props => {
    function formatData(rawData) {
        // TBD
        return rawData;
    }

    return (
        <SummaryMetric
            title={props.title}
            data={formatData(props.data[props.activeCategory])}
        />
    );
};
