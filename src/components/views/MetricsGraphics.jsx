import React from 'react';
import MG from 'metrics-graphics';


// Draws a metrics-graphics chart into its own div. Every prop is passed to
// MG.data_graphic as an option, and the chart is redrawn on every update.
export default class extends React.Component {
    chartElement = React.createRef();

    componentDidMount() {
        this._draw();
    }

    componentDidUpdate() {
        this._draw();
    }

    _draw() {
        MG.data_graphic({ ...this.props, target: this.chartElement.current });
    }

    render() {
        return <div className="metricsGraphicsCon" ref={this.chartElement} />;
    }
}
