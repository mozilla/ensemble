import React from 'react';

import DashboardSection from '../viewRouters/DashboardSection';
import ChartWrappers from '../viewRouters/ChartWrappers';

import { bumpSort } from '../../utils';

import './css/Dashboard.css';


export default props => {
    let maybeCategorySelector = null;
    const sortedCategories = bumpSort(props.categories, 'All');

    if (sortedCategories.length > 1) {
        maybeCategorySelector = (
            <div id="category">
                <label htmlFor="category">Region</label>
                <select name="category" value={props.activeCategory} onChange={props.onCategoryChange}>
                    {sortedCategories.map(categoryName => {
                        return (
                            <option key={categoryName} value={categoryName}>
                                {categoryName}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    let body = null;
    if (props.sections) {
        body = (
            <section id="dashboard-sections">
                {props.sections.map((s, index) => (
                    <DashboardSection
                        key={index}

                        sectionKey={s.key}
                        title={s.title}
                        charts={props.charts.filter(c => c.section === s.key)}
                        activeCategory={props.activeCategory}
                    />
                ))}
            </section>
        );
    } else {
        body = (
            <ChartWrappers charts={props.charts} activeCategory={props.activeCategory} />
        );
    }

    return (
        <article id="dashboard">
            <header>
                <h2>{props.title}</h2>
                <p id="dashboard-description">{props.description}</p>
                {maybeCategorySelector}
            </header>
            {body}
        </article>
    );
};
