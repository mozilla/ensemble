import React from 'react';

import CustomizableDate from '../views/CustomizableDate';


export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = { activeDate: null };
    }

    _onDateChange = e => {
        this.setState({ activeDate: e.target.value });
    }

    render() {
        const mostRecentDate = this.props.dates[0];
        const activeDate = this.state.activeDate || mostRecentDate;

        // Don't pass children as a prop to CustomizableDate. It's already being
        // passed as an actual child and there's no need to pass it twice.
        const {children, ...cdmProps} = this.props;

        let childrenWithProps;
        if (Array.isArray(children)) {
            childrenWithProps = children.map(child => {
                return React.cloneElement(child, {...this.props});
            });
        } else {
            childrenWithProps = React.cloneElement(children, {...this.props});
        }

        return (
            <CustomizableDate {...cdmProps} dates={this.props.dates} activeDate={activeDate} onDateChange={this._onDateChange}>
                {childrenWithProps}
            </CustomizableDate>
        );
    }
}
