import React from 'react';

import DataTable from '../views/DataTable';


export default class extends React.Component {
    formatData(dates) {
        // Sort by value in descending order
        return dates[this.props.activeDate].rows.sort((a, b) => b.value - a.value);
    }

    render() {
        const formattedData = this.formatData(this.props.data.dates);

        return (
            <DataTable
                {...this.props}

                data={formattedData}
                columns={this.props.columns}
            />
        );
    }
}
