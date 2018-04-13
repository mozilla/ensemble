import React from 'react';

import dateformat from 'dateformat';

import './css/CustomizableDateMetric.css';
import './css/Metric.css';
import './css/LabelledSelector.css';


export default props => {
    const childProps = Object.assign({}, ...props, { activeDate: props.activeDate });

    return (
        <div className="metric customizable-date-metric">
            <h3 className="metric-title">{props.title}</h3>
            <div className="labelled-selector">
                <label htmlFor="date-selector">Date</label>
                <select id="date-selector" value={props.activeDate} onChange={props.onDateChange}>
                    {props.dates.map((date, index) => (
                        <option key={index} value={date}>
                            {dateformat(date, 'longDate', true)}
                        </option>
                    ))};
                </select>
            </div>
            { React.cloneElement(props.children, {...childProps}) }
        </div>
    );
};
