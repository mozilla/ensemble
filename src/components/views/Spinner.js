import React from 'react';
import { PulseLoader } from 'react-spinners';

import './css/Spinner.css';


/**
 * Simple wrapper for react-spinners that uses some default options and applies
 * our custom styles.
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
        setTimeout(() => {
            this.setState({ showSpinner: true });
        }, 1000);
    }

    render() {
        return (
            <div id="spinner">
                <PulseLoader
                    size="20"
                    loading={this.state.showSpinner}
                />
            </div>
        );
    }
}
