import React from 'react';
import * as Plot from '@observablehq/plot';


// Draws an Observable Plot chart into its own div, with the point under the
// pointer described above it by renderReadout. Plot reports that point as the
// chart's value through "input" events.
export default class extends React.Component {
    chartElement = React.createRef();

    state = { hovered: null };

    componentDidMount() {
        this._draw();
    }

    componentDidUpdate(previousProps) {
        // Hovering changes only the readout, so the chart itself is redrawn
        // only when its options change.
        if (previousProps.options !== this.props.options) {
            this._draw();
        }
    }

    componentWillUnmount() {
        this.chartElement.current.replaceChildren();
    }

    _draw() {
        const chart = Plot.plot(this.props.options);
        chart.addEventListener('input', () => this.setState({ hovered: chart.value }));
        this.chartElement.current.replaceChildren(chart);
        this.setState({ hovered: null });
    }

    render() {
        const hovered = this.state.hovered;
        return (
            <div className="observable-plot">
                <p className="chart-readout">
                    {hovered ? this.props.renderReadout(hovered) : null}
                </p>
                <div ref={this.chartElement} />
            </div>
        );
    }
}
