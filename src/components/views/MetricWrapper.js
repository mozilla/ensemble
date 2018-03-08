import React from 'react';

import MetricContainer from '../containers/MetricContainer';
import MetricDescription from './MetricDescription';

import './css/MetricWrapper.css';


export default props => {
    // Temporarily hidden. See the following Issue.
    // https://github.com/mozilla/ensemble/issues/50
    if (props.title === 'Top Add-ons') return null;

    let maybeMetricDescription = null;
    if (props.description) {
        maybeMetricDescription = (
            <MetricDescription
                description={props.description}
            />
        );
    }

    // The data-populations thing is a workaround for metrics-graphics issue
    // #806. See the comment in PopulationColors.css for more information.
    return (
        <div className={`${props.identifier} metric-wrapper`} data-populations={Object.keys(props.categories[props.activeCategory].populations).length}>
            <div className="metric-and-legend">
                <MetricContainer
                    legendTarget={`.${props.identifier} .legend`}
                    title={props.title}
                    categories={props.categories}
                    activeCategory={props.activeCategory}
                    axes={props.axes || {}}
                    labels={props.labels || {}}
                    scales={props.scales || {}}
                />
                <div className="legend" />
            </div>
            {maybeMetricDescription}
        </div>
    );
};
