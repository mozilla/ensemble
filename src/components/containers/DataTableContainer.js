import React from 'react';

import DataTable from '../views/DataTable';


export default class extends React.Component {
    formatData(dates) {
        // For the time being, only show the latest date
        const sortedDates = Object.keys(dates).sort((a, b) => new Date(a) > new Date(b));
        const mostRecentDate = sortedDates[sortedDates.length - 1];

        return dates[mostRecentDate].rows.sort((a, b) => b.value - a.value);
    }

    render() {
        const formattedData = this.formatData(this.props.categories[this.props.activeCategory].dates);

        return (
            <DataTable
                {...this.props}

                data={formattedData}
                columns={this.props.columns}
            />
        );
    }
}
