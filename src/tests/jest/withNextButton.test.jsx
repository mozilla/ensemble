import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';

import withNextButton from '../../components/decorators/withNextButton';
import { nextButtons } from '../../config.json';


const Page = () => <p>Page content</p>;
const PageWithNextButton = withNextButton(Page);

function renderAt(path) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Route component={PageWithNextButton} />
        </MemoryRouter>
    );
}

it.each(nextButtons)('$from shows "$text" linking to $to', ({ from, to, text }) => {
    renderAt(from);

    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: text })).toHaveAttribute('href', to);
});

it('Pages without a nextButtons entry get no button', () => {
    const { container } = renderAt('/contact');

    expect(screen.getByText('Page content')).toBeInTheDocument();
    expect(container.querySelector('.next-button')).toBeNull();
});
