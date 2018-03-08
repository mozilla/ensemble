import React from 'react';

import DashboardSection from './DashboardSection';
import MetricWrappers from './MetricWrappers';
import SummaryMetricContainer from '../containers/SummaryMetricContainer';

import { bumpSort } from '../../utils';

import './css/Dashboard.css';


export default props => {
    const sortedCategories = bumpSort(props.categories, 'All');

    let maybeSummaryMetrics = null;
    if (props.summaryMetrics) {
        maybeSummaryMetrics = (
            <section id="summary-metrics">
                {props.summaryMetrics.map((metricTitle, index) => (
                    <SummaryMetricContainer
                        key={index}

                        title={metricTitle}
                        categories={props.metrics.find(m => m.title === metricTitle).categories}
                        activeCategory={props.activeCategory}
                    />
                ))}
            </section>
        );
    }

    let maybeCategorySelector = null;
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
                        metrics={props.metrics.filter(c => c.section === s.key)}
                        activeCategory={props.activeCategory}
                    />
                ))}
            </section>
        );
    } else {
        body = (
            <MetricWrappers metrics={props.metrics} activeCategory={props.activeCategory} />
        );
    }

    return (
        <article id="dashboard">
            <header>
                <h2>{props.title}</h2>
                <p id="dashboard-description">{props.description}</p>
                {maybeCategorySelector}
                {maybeSummaryMetrics}
            </header>
            {body}
        </article>
    );
};
