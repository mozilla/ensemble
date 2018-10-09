import React from 'react';

import dateformat from 'dateformat';

import './css/CustomizableDate.css';
import './css/Metric.css';
import './css/LabelledSelector.css';


export default props => {
    const childProps = Object.assign({}, props, { activeDate: props.activeDate });

    let childrenWithProps;
    if (Array.isArray(props.children)) {
        childrenWithProps = props.children.map(child => {
            return React.cloneElement(child, {...childProps});
        });
    } else {
        childrenWithProps = React.cloneElement(props.children, {...childProps});
    }

    const classes = ['customizable-date'];
    if (props.metric) {
        classes.push('metric');
    }

    if (!props.titleComponent) {
        classes.push('spaced');
    }

    return (
        <div className={classes.join(' ')}>
            {props.titleComponent}
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
            { childrenWithProps }
        </div>
    );
};
