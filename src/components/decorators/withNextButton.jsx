import React from 'react';
import { useLocation } from 'react-router-dom';

import NextButton from '../views/NextButton';
import { nextButtons as nextButtonsConfig } from '../../config.json';


export default WrappedComponent => props => {
    const { pathname } = useLocation();
    const nextButtonMeta = nextButtonsConfig.find(nbm => nbm.from === pathname);

    if (nextButtonMeta) {
        return (
            <React.Fragment>
                <WrappedComponent {...props} />
                <NextButton
                    to={nextButtonMeta.to}
                    text={nextButtonMeta.text}
                />
            </React.Fragment>
        );
    }

    return <WrappedComponent {...props} />;
};
