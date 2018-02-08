import React from 'react';

import Chart from '../views/Chart';


export default class extends React.Component {
    formatData(populations) {
        const data = [];
        const legend = [];

        for (const populationName in populations) {
            legend.push(populationName);

            // Don't show a data point if the y value is null. Active user
            // metrics (YAU, MAU, etc.) have null y values for most dates.
            const dataToShow = populations[populationName].filter(pd => pd.y !== null);

            data.push(dataToShow.map(pd => {
                return {
                    x: Date.parse(pd.x) ? new Date(pd.x) : pd.x,
                    y: pd.y,
                };
            }));
        };

        return { data, legend };
    }

    render() {
        const formatted = this.formatData(this.props.populations);
        const showLegend = Object.keys(this.props.populations).length > 1;

        return (
            <Chart
                {...this.props}
                data={formatted.data}
                legend={formatted.legend}
                showLegend={showLegend}
            />
        );
    }
}
