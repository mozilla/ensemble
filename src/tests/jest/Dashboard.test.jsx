import { render } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';

import Dashboard from '../../components/views/Dashboard';


let requiredProps;

beforeAll(() => {
    requiredProps = {
        metrics: [],
        regions: [],
    };
});

it('When a description prop is present, p#dashboard-description is rendered', () => {
    const { container } = render(
        <Dashboard
            {...requiredProps}
            description="Example description"
        />,
        { wrapper: HelmetProvider }
    );

    expect(container.querySelector('#dashboard-description')).toHaveTextContent('Example description');
});

it('When a description prop is not present, an empty string, undefined, or null, p#dashboard-description is not rendered', () => {
    [{}, { description: '' }, { description: undefined }, { description: null }].forEach(descriptionProps => {
        const { container, unmount } = render(
            <Dashboard
                {...requiredProps}
                {...descriptionProps}
            />,
            { wrapper: HelmetProvider }
        );

        expect(container.querySelector('#dashboard-description')).toBeNull();
        unmount();
    });
});
