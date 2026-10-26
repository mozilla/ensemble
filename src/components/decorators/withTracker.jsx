import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import reactGA from 'react-ga';


reactGA.initialize(import.meta.env.VITE_GA_TRACKING_ID);

export default (WrappedComponent, options = {}) => props => {
    const page = useLocation().pathname;

    useEffect(() => {
        reactGA.set({
            page,
            ...options,
        });
        reactGA.pageview(page);
    }, [page]);

    return <WrappedComponent {...props} />;
};
