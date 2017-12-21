import React from 'react';
import MetricsGraphics from 'react-metrics-graphics';

import 'metrics-graphics/dist/metricsgraphics.css';


export default props => (
    <MetricsGraphics
        title={props.title}
        show_tooltips={false}
        data={props.data}
        x_accessor="x"
        y_accessor="y"

        width={600}
        height={500}

        yax_units_append={true}
        yax_units={props.units.y}

        x_label={props.labels.x}
        y_label={props.labels.y}

        x_scale_type={props.scales.x}
        y_scale_type={props.scales.y}
    />
);
