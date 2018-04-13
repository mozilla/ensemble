import React from 'react';
import { scaleLinear } from 'd3-scale';
import { select } from 'd3-selection';

import './css/SummaryMetric.css';


/**
 * Based on Ali Ali Almosawi's work for the original Firefox Hardware Report:
 * https://github.com/mozilla/firefox-hardware-report/blob/master/js/main.js
 */
export default class extends React.Component {
    constructor(props) {
        super(props);

        this.ref = React.createRef();

        this.size = {
            width: 450,
            height: 90,
            xPaddingLeft: 0,
            xPaddingRight: 30,
            barYPosition: 15,
            barHeight: 22
        };

        this.colors = [
            '#2bacfb',
            '#f44d29',
            '#31d620',
            '#fd9213',
            '#fdb813',
            '#fdd413',
            '#fdf513',
            '#75cbff',
            '#454545',
            '#b4b4b4',
            '#f1f1f1',
        ];

        // Don't show arrows (since they'll be bigger than the bar) if they are
        // below this value threshold.
        this.arrowIgnoreThreshold = 4;
    }

    shouldComponentUpdate(nextProps) {
        return nextProps.data !== this.props.data;
    }

    componentDidMount() {
        this._drawChart(this.props.data);
    }

    componentDidUpdate() {
        // Clear the SVG before redrawing it
        this.svg.text('');

        this._drawChart(this.props.data);
    }

    _drawChart(data) {
        const showBarItem = item => {
            this.svg.selectAll('.bar-arrow').style('display', 'none');
            this.svg.selectAll('.bar-label').style('display', 'none');

            this.svg.select(`.bar-label_${item.id}`).style('display', 'inline');
            this.svg.select(`.bar-arrow_${item.id}`).style('display', 'inline');
        }

        const xScale = scaleLinear().domain([0, 1])
                           .range([0, this.size.width - this.size.xPaddingRight]);

        this.svg = select(this.ref.current);
        const rects = this.svg.selectAll('rect.bar');
        let xMarker = 0;

        this.svg.attr('width', this.size.width)
            .attr('height', this.size.height);

        this.svg.attr('viewBox', `0 0 ${this.size.width} ${this.size.height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet');

        rects.data(data).enter().append('rect')
            .attr('class', d => 'bar bar-' + d.id)
            .attr('width', d => {
                if (d.value === undefined) {
                    return xScale(0);
                } else {
                    return xScale(d.value / 100).toFixed(1);
                }
            })
            .attr('x', (d, i) => {
                if (d.value === undefined) d.value = 0;

                const myXMarker = xMarker;
                xMarker += d.value / 100;

                // append circle
                this.svg.append('circle')
                    .attr('r', 8)
                    .attr('class', () => 'bar-arrow bar-arrow_' + d.id)
                    .attr('cx', () => this.size.xPaddingLeft + xScale(
                        myXMarker + ((xMarker - myXMarker) / 2)
                    ))
                    .attr('cy', this.size.barYPosition + this.size.barHeight - 3)
                    .style('fill', () => this.colors[i])
                    .style('opacity', () => {
                        if (d.value < this.ignoreThreshold) return 0;
                    });

                // append text labels
                this.svg.append('text')
                    .attr('class', `bar-label bar-label_${d.id}`)
                    .attr('text-anchor', 'middle')
                    .attr('x', () => this.size.xPaddingLeft + xScale(
                        myXMarker + ((xMarker - myXMarker) / 2))
                    )
                    .attr('y', this.size.barYPosition + this.size.barHeight + 22)
                    .text(`${d.name} (${d.value.toLocaleString('en-US', {
                        minimumFractionDigits: process.env.REACT_APP_VALUE_FRACTION_DIGITS,
                        maximumFractionDigits: process.env.REACT_APP_VALUE_FRACTION_DIGITS
                    })}%)`)
                    .style('fill', '#000000');

                return this.size.xPaddingLeft + xScale(myXMarker);
            })
            .attr('y', this.size.barYPosition)
            .attr('height', this.size.barHeight)
            .style('fill', (d, i) => this.colors[i])

            // Until a bar is hovered or clicked, show the first item of the bar chart.
            .style('display', (d, i) => {
                if (i === 0) {
                    showBarItem(d);
                }
            })

            // Show the currently hovered or clicked bar's arrow and label.
            .on('mouseenter click', showBarItem);
    }

    render() {
        return (
            <div className="summary-metric">
                <h4>{this.props.title}</h4>
                <svg ref={this.ref} />
            </div>
        );
    }
}
