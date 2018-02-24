import React from 'react';

import DashboardSection from './DashboardSection';
import ChartWrappers from './ChartWrappers';

import './css/Dashboard.css';


export default props => {
    let maybeCategorySelector = null;
    if (props.categories.length > 1) {
        maybeCategorySelector = (
            <div id="category">
                <label htmlFor="category">Region</label>
                <select name="category" onChange={props.onCategoryChange}>
                    {props.categories.map(categoryName => {
                        return (
                            <option key={categoryName} value={categoryName}> {categoryName}
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
