import React from 'react';

import NextButton from '../views/NextButton';
import nextButtonsConfig from '../../config/nextButtons.json';


export default WrappedComponent => {
    const HOC = class extends React.Component {
        render() {
            const nextButtonMeta = nextButtonsConfig.find(nbm => {
                return nbm.from === this.props.location.pathname
            });

            if (nextButtonMeta) {
                return (
                    <React.Fragment>
                        <WrappedComponent {...this.props} />
                        <NextButton
                            to={nextButtonMeta.to}
                            text={nextButtonMeta.text}
                        />
                    </React.Fragment>
                );
            } else {
                return <WrappedComponent {...this.props} />;
            }
        }
    };

    return HOC;
};
