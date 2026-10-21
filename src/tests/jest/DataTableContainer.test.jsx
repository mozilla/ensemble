import { render } from '@testing-library/react';

import DataTableContainer from '../../components/containers/DataTableContainer';


it('Rows for the active date are ranked by value, highest first', () => {
    const { container } = render(
        <DataTableContainer
            activeDate="2026-01-04"
            columns={[{ name: 'Language' }, { name: 'Share', unit: '%' }]}
            data={{
                dates: {
                    '2026-01-04': {
                        rows: [
                            { name: 'German', value: 10.5 },
                            { name: 'English (US)', value: 40 },
                            { name: 'French', value: 12.25 },
                        ],
                    },
                    '2025-12-28': {
                        rows: [{ name: 'Japanese', value: 99 }],
                    },
                },
            }}
        />
    );

    const rows = [...container.querySelectorAll('tbody tr')].map(row => (
        [...row.querySelectorAll('td')].map(cell => cell.textContent)
    ));

    expect(rows).toEqual([
        ['1', 'English (US)', '40%'],
        ['2', 'French', '12.250%'],
        ['3', 'German', '10.500%'],
    ]);
    expect([...container.querySelectorAll('thead th')].map(cell => cell.textContent)).toEqual(['Rank', 'Language', 'Share']);
});
