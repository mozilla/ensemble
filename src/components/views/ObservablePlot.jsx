import React from 'react';
import * as Plot from '@observablehq/plot';


function shallowEqual(first, second) {
    const keys = Object.keys(first);
    return keys.length === Object.keys(second).length && keys.every(key => first[key] === second[key]);
}

// Draws an Observable Plot chart into its own div, with the point under the
// pointer described above it by renderReadout. Plot reports that point as the
// chart's value through "input" events.
//
// options is rebuilt on every render, so the chart is redrawn only when one of
// the values in drawnFrom, the inputs options was built from, changes. Redrawing
// replaces the SVG and with it a readout pinned by a click, so anything that
// can change without a redraw, such as a highlight, is applied by restyle to
// the SVG already drawn.
export default class extends React.Component {
    chartElement = React.createRef();

    state = { hovered: null };

    componentDidMount() {
        this._draw();
    }

    componentDidUpdate(previousProps) {
        if (!shallowEqual(previousProps.drawnFrom, this.props.drawnFrom)) {
            this._draw();
        } else if (previousProps.restyle !== this.props.restyle) {
            this.props.restyle?.(this.chart);
        }
    }

    componentWillUnmount() {
        this.chartElement.current.replaceChildren();
    }

    _draw() {
        const chart = Plot.plot(this.props.options);
        chart.addEventListener('input', () => this.setState({ hovered: chart.value }));
        this.props.restyle?.(chart);
        this.chartElement.current.replaceChildren(chart);
        this.chart = chart;
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
