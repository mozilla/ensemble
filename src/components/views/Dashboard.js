import React from 'react';
import Helmet from 'react-helmet';

import DashboardSection from './DashboardSection';
import MetricOverviewCollection from './MetricOverviewCollection';
import SummaryMetricContainer from '../containers/SummaryMetricContainer';
import CustomizableDateContainer from '../containers/CustomizableDateContainer';
import StripedHeader from './StripedHeader';

import { bumpSort, getPageTitle } from '../../lib/utils';

import './css/Dashboard.css';
import './css/LabelledSelector.css';


export default props => {
    let maybeSummaryMetrics = null;
    if (props.summaryMetrics) {
        const summaryMetricContainers = [];
        props.summaryMetrics.forEach(summaryMetricSlug => {
            summaryMetricContainers.push(
                <SummaryMetricContainer
                    key={summaryMetricSlug}
                    slug={summaryMetricSlug}
                    dashboardSource={props.dashboardSource}
                    activeCategory={props.activeCategory}
                />
            );
        });

        const titleComponent = <StripedHeader tag="h3" label="Summary" />;
        maybeSummaryMetrics = (
            <section id="summary-metrics">
                <CustomizableDateContainer
                    dates={props.dates}
                    titleComponent={titleComponent}
                >
                    {summaryMetricContainers}
                </CustomizableDateContainer>
            </section>
        );
    }

    let maybeDescription, maybeMetaDescription, maybeGraphDescription = null;
    if (props.description) {
        maybeDescription = (
            <p id="dashboard-description">{props.description}</p>
        );

        maybeMetaDescription = (
            <meta
                name="description"
                content={props.description}
            />
        );

        maybeGraphDescription = (
            <meta
                property="og:description"
                content={props.description}
            />
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
                        metrics={s.metrics}
                        activeCategory={props.activeCategory}
                        dashboardSource={props.dashboardSource}
                    />
                ))}
            </section>
        );
    } else {
        body = (
            <MetricOverviewCollection
                metrics={props.metrics}
                activeCategory={props.activeCategory}
                dashboardSource={props.dashboardSource}
            />
        );
    }

    const pageTitle = getPageTitle(props.title);

    return (
        <React.Fragment>
            <Helmet>
                <title>{pageTitle}</title>
                <meta property="og:title" content={pageTitle} />
                {maybeGraphDescription}
                {maybeMetaDescription}
            </Helmet>
            <article id="dashboard">
                <header className="dashboard-header">
                    <h2 id="dashboard-title" className="contrasted">{props.title}</h2>
                    {maybeDescription}
                    {maybeCategory}
                </header>
                {maybeSummaryMetrics}
                <h3 id="metrics-heading">Metrics</h3>
                {body}
            </article>
        </React.Fragment>
    );
};
