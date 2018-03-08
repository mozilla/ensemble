import React from 'react';

import CustomizableDateMetric from '../views/CustomizableDateMetric';


export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = { activeDate: null };
    }

    _onDateChange = e => {
        this.setState({ activeDate: e.target.value });
    }

    render() {
        const dates = Object.keys(this.props.categories[this.props.activeCategory].dates).sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        const mostRecentDate = dates[0];
        const activeDate = this.state.activeDate || mostRecentDate;

        // Don't pass children as a prop to CustomizableDateMetric. It's already
        // being passed as an actual child and there's no need to pass it twice.
        const {children, ...cdmProps} = this.props;

        return (
            <CustomizableDateMetric {...cdmProps} dates={dates} activeDate={activeDate} onDateChange={this._onDateChange}>
                { React.cloneElement(children, {...this.props}) }
            </CustomizableDateMetric>
        );
    }
}
