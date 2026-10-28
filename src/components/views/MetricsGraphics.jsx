import React from 'react';
import MG from 'metrics-graphics';


// Draws a metrics-graphics chart into its own div. Every prop is passed to
// MG.data_graphic as an option, and the chart is redrawn on every update.
//
// A redraw with the same data, such as after a resize, isn't animated.
// metrics-graphics animates each line by sampling it every few pixels, which
// is cheap for one region change but hangs the page when every resize event
// redraws every chart.
export default class extends React.Component {
    chartElement = React.createRef();

    componentDidMount() {
        this._draw();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.data === this.props.data) {
            this._draw({ transition_on_update: false });
        } else {
            this._draw();
        }
    }

    _draw(extraOptions = {}) {
        MG.data_graphic({ ...this.props, ...extraOptions, target: this.chartElement.current });
    }

    render() {
        return <div className="metricsGraphicsCon" ref={this.chartElement} />;
    }
}
