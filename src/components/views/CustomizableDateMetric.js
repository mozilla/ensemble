import React from 'react';

import dateformat from 'dateformat';

import './css/CustomizableDateMetric.css';


export default props => {
    const childProps = Object.assign({}, ...props, { activeDate: props.activeDate });

    return (
        <section className="customizable-date-metric">
            <h3>{props.title}</h3>
            <select value={props.activeDate} onChange={props.onDateChange}>
                {props.dates.map((date, index) => (
                    <option key={index} value={date}>
                        {dateformat(date, 'longDate', true)}
                    </option>
                ))};
            </select>
            { React.cloneElement(props.children, {...childProps}) }
        </section>
    );
};
