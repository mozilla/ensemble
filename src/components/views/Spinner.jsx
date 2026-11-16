import React from 'react';
import { PulseLoader } from 'react-spinners';

import './css/Spinner.css';


/**
 * Simple wrapper for react-spinners that uses some default options and applies
 * our custom styles. With a label, screen readers announce it when the dots
 * appear: the status region is there from the start and its text arrives
 * later, because text already in a newly added region often isn't announced.
 */
export default class extends React.Component {
    constructor(props) {
        super(props);
        this.state = { showSpinner: false };
    }

    componentDidMount() {
        // According to Jakob Nielsen's research, "no special feedback is
        // necessary during delays of more than 0.1 but less than 1.0 second."
        //
        // react-spinkit, a competing library, does this by default
        //
        // https://www.nngroup.com/articles/response-times-3-important-limits/
        this.showSpinnerTimeout = setTimeout(() => {
            this.setState({ showSpinner: true });
        }, 1000);
    }

    componentWillUnmount() {
        clearTimeout(this.showSpinnerTimeout);
    }

    render() {
        return (
            <div className="spinner">
                {this.props.label ? (
                    <span role="status" className="visually-hidden">
                        {this.state.showSpinner ? this.props.label : null}
                    </span>
                ) : null}
                <PulseLoader
                    size={20}
                    loading={this.state.showSpinner}
                />
            </div>
        );
    }
}
