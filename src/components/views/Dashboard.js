import React from 'react';

import DashboardSection from './DashboardSection';
import MetricOverviewCollection from './MetricOverviewCollection';

import { bumpSort } from '../../lib/utils';

import './css/Dashboard.css';
import './css/LabelledSelector.css';


export default props => {
    let maybeCategory = null;
    const sortedCategories = bumpSort(props.categories, 'All');
    if (sortedCategories.length > 1) {
        maybeCategory = (
            <aside id="category">
                <div className="labelled-selector">
                    <label htmlFor="category-selector">Region</label>
                    <select id="category-selector" name="category" value={props.activeCategory} onChange={props.onCategoryChange}>
                        {sortedCategories.map(categoryName => (
                            <option key={categoryName} value={categoryName}>
                                {categoryName}
                            </option>
                        ))}
                    </select>
                </div>
            </aside>
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
                        metrics={props.metrics.filter(c => c.section === s.key)}
                        activeCategory={props.activeCategory}
                    />
                ))}
            </section>
        );
    } else {
        body = (
            <MetricOverviewCollection metrics={props.metrics} activeCategory={props.activeCategory} />
        );
    }

    return (
        <article id="dashboard">
            <header>
                <h2 id="dashboard-title">{props.title}</h2>
                <p id="dashboard-description">{props.description}</p>
            </header>
            {maybeCategory}
            {body}
        </article>
    );
};
