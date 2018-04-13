import React from 'react';

import './css/DataTable.css';


export default props => {
    const valueFractionDigits = 3;

    return (
        <section className="data-table-wrapper">
            <table className="data-table">
                <colgroup>
                    <col className="rank" />
                    <col className="name" />
                    <col className="value" />
                </colgroup>
                <thead>
                    <tr>
                        <th>Rank</th>
                        {props.columns.map((column, index) => (
                            <th key={index}>{column.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {props.data.map((row, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{row.name}</td>
                            <td>
                                {row.value.toLocaleString('en-US', {
                                    minimumFractionDigits: valueFractionDigits,
                                    maximumFractionDigits: valueFractionDigits,
                                })}{props.columns[1].unit}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
};
