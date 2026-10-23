import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CustomizableDateContainer from '../../components/containers/CustomizableDateContainer';
import DataTableContainer from '../../components/containers/DataTableContainer';


const tableData = {
    dates: {
        '2026-01-04': {
            rows: [
                { name: 'uBlock Origin', value: 2 },
                { name: 'Dark Reader', value: 1 },
            ],
        },
        '2025-12-28': {
            rows: [
                { name: 'Dark Reader', value: 3 },
                { name: 'uBlock Origin', value: 1 },
                { name: 'Bitwarden', value: 0.5 },
            ],
        },
    },
};

function renderTableWithDates(dates) {
    return render(
        <CustomizableDateContainer dates={dates} metric={true}>
            <DataTableContainer data={tableData} columns={[{ name: 'Add-on' }, { name: 'Usage', unit: '%' }]} />
        </CustomizableDateContainer>
    );
}

function tableRows(container) {
    return [...container.querySelectorAll('tbody tr')].map(row => (
        [...row.querySelectorAll('td')].map(cell => cell.textContent)
    ));
}

it('Dates are listed as long dates in UTC, and the table starts on the first one', () => {
    const { container } = renderTableWithDates(['2026-01-04', '2025-12-28']);

    const selector = screen.getByLabelText('Date');
    expect([...selector.options].map(option => option.textContent)).toEqual(['January 4, 2026', 'December 28, 2025']);
    expect(selector).toHaveValue('2026-01-04');
    expect(tableRows(container)).toEqual([
        ['1', 'uBlock Origin', '2%'],
        ['2', 'Dark Reader', '1%'],
    ]);
});

it('Choosing another date shows that date\'s rows in the table', async () => {
    const user = userEvent.setup();
    const { container } = renderTableWithDates(['2026-01-04', '2025-12-28']);

    await user.selectOptions(screen.getByLabelText('Date'), '2025-12-28');

    expect(tableRows(container)).toEqual([
        ['1', 'Dark Reader', '3%'],
        ['2', 'uBlock Origin', '1%'],
        ['3', 'Bitwarden', '0.500%'],
    ]);
});
