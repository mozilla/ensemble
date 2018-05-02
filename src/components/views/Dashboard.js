import React from 'react';

import DashboardSection from './DashboardSection';
import MetricOverviewCollection from './MetricOverviewCollection';
import SummaryMetricContainer from '../containers/SummaryMetricContainer';
import CustomizableDateContainer from '../containers/CustomizableDateContainer';
import StripedHeader from './StripedHeader';

import { bumpSort } from '../../lib/utils';

import './css/Dashboard.css';
import './css/LabelledSelector.css';


export default props => {
    let maybeSummaryMetrics = null;
    if (props.summaryMetrics) {
        const allDatesSet = new Set();
        props.summaryMetrics.forEach(currentMetricTitle => {
            const currentData = props.metrics.find(m => m.title === currentMetricTitle).data[props.activeCategory];
            Object.keys(currentData.populations).forEach(populationName => {
                currentData.populations[populationName].forEach(dp => allDatesSet.add(dp.x));
            });
        });

        const summaryMetricContainers = [];
        props.summaryMetrics.forEach((metricTitle, index) => {
            summaryMetricContainers.push(
                <SummaryMetricContainer
                    key={index}

                    title={metricTitle}
                    data={props.metrics.find(m => m.title === metricTitle).data}
                    activeCategory={props.activeCategory}
                />
            );
        });

        const titleComponent = <StripedHeader tag="h3" label="Summary" />;
        maybeSummaryMetrics = (
            <section id="summary-metrics">
                <CustomizableDateContainer
                    dates={Array.from(allDatesSet)}
                    titleComponent={titleComponent}
                >
                    {summaryMetricContainers}
                </CustomizableDateContainer>
            </section>
        );
    }

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
            <header className="dashboard-header">
                <h2 id="dashboard-title" className="contrasted">{props.title}</h2>
                <p id="dashboard-description">{props.description}</p>
                {maybeCategory}
            </header>
            {maybeSummaryMetrics}
            <h3 id="metrics-heading">Metrics</h3>
            {body}
        </article>
    );
};
