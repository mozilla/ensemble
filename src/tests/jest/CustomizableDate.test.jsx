import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CustomizableDateContainer from '../../components/containers/CustomizableDateContainer';


const ShowsActiveDate = props => <p>Showing {props.activeDate}</p>;

function renderWithDates(dates) {
    return render(
        <CustomizableDateContainer dates={dates}>
            <ShowsActiveDate />
        </CustomizableDateContainer>
    );
}

it('Dates are listed as long dates in UTC, and the first one is selected', () => {
    renderWithDates(['2026-01-04', '2025-12-28']);

    const selector = screen.getByLabelText('Date');
    expect([...selector.options].map(option => option.textContent)).toEqual(['January 4, 2026', 'December 28, 2025']);
    expect(selector).toHaveValue('2026-01-04');
    expect(screen.getByText('Showing 2026-01-04')).toBeInTheDocument();
});

it('Choosing another date passes it to the children', async () => {
    const user = userEvent.setup();
    renderWithDates(['2026-01-04', '2025-12-28']);

    await user.selectOptions(screen.getByLabelText('Date'), '2025-12-28');

    expect(screen.getByText('Showing 2025-12-28')).toBeInTheDocument();
});
