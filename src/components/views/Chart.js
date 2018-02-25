import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';
import dateformat from 'dateformat';

import 'metrics-graphics/dist/metricsgraphics.css';
import './css/PopulationColors.css';
import './css/MGDarkTheme.css';


export default props => {
    const extraOptions = {};
    const yRolloverPrecision = 10;
    const yUnit = props.units.y || '';

    let yUnitString = '';
    if (yUnit) {
        if (yUnit === '%') {
            yUnitString = yUnit;
        } else {
            yUnitString = ' ' + yUnit;
        }
    }

    if (props.showLegend) {
        extraOptions.legend = props.legend;
        extraOptions.legend_target = props.legendTarget;
    }

    return (
        <MetricsGraphics
            title={props.title}
            show_tooltips={false}
            data={props.data}
            x_accessor="x"
            y_accessor="y"

            width={600}
            height={600}

            x_rollover_format={dp => `(${dateformat(dp.x, 'mmmm d, yyyy')}, `}
            y_rollover_format={dp => `${dp.y.toPrecision(yRolloverPrecision)}${yUnitString})`}

            x_label={props.labels.x}
            y_label={props.labels.y}

            x_scale_type={props.scales.x}
            y_scale_type={props.scales.y}

            {...extraOptions}
        />
    );
};
