import React from 'react';

import SummaryMetric from '../views/SummaryMetric';


export default class extends React.Component {
    formatData() {

    }
    render() {
        const formattedData = formatData(this.props.categories[this.props.activeCategory]);

        return (
            <SummaryMetric />
        );
    }
}
