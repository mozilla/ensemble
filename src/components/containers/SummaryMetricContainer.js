import React from 'react';

import SummaryMetric from '../views/SummaryMetric';


export default props => {
    function formatData(rawData) {
        const formattedData = []
        const populations = Object.keys(rawData.populations);

        // True/False charts
        if (populations.length === 1) {
            const onlyPopulation = rawData.populations[populations[0]];

            formattedData.push({
                id: 0,
                name: "True",

                // TODO: For now, take the most recent date
                value: onlyPopulation[onlyPopulation.length - 1].y,
            });

            formattedData.push({
                id: 1,
                name: "False",

                // TODO: For now, take the most recent date
                value: 100 - onlyPopulation[onlyPopulation.length - 1].y,
            });
        }


        // Multi-population charts
        else {
            const otherThreshold = 5;
            let otherValue = 0;

            let index = 0;
            populations.forEach(populationName => {
                const numDataPoints = rawData.populations[populationName].length;
                const value = rawData.populations[populationName][numDataPoints - 1].y;

                // If a population has >= otherThreshold representation, it
                // should have its own section of the chart.
                if (value >= otherThreshold) {
                    formattedData.push({
                        id: index,
                        name: populationName,

                        // TODO: For now, take the most recent date
                        value: rawData.populations[populationName][numDataPoints - 1].y,
                    });
                }

                // Otherwise, if a chart has < otherThreshold representation, it
                // should be grouped into an "Other" category.
                else {
                    otherValue += value;
                }

                index++;
            });

            if (otherValue > 0) {
                formattedData.push({
                    id: index,
                    name: 'Other',
                    value: otherValue,
                });
            }
        }

        // Reverse-sort by value so that the biggest population appears first in
        // the summary metric. "Other" always appears last.
        formattedData.sort((a, b) => {
            if (a.name === 'Other') return 1;
            if (b.name === 'Other') return -1;
            return b.value - a.value;
        });

        return formattedData;
    }

    return (
        <SummaryMetric
            title={props.title}
            data={formatData(props.data[props.activeCategory])}
        />
    );
};
