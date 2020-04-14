import React from 'react';
import markdownIt from 'markdown-it';
import { Helmet } from 'react-helmet';

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
                    activeRegion={props.activeRegion}
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

    let maybeDescription = null;
    let maybeMetaDescription = null;
    let maybeGraphDescription = null;

    if (props.description) {
        const multipleParagraphs = Array.isArray(props.description);
        const markdownParser = markdownIt('zero').enable(['emphasis']);

        if (multipleParagraphs) {
            maybeDescription = (
                <div id="dashboard-description">
                    {props.description.map((paragraph, index) => (
                        <p key={index} dangerouslySetInnerHTML={
                            {__html: markdownParser.renderInline(paragraph)}
                        } />
                    ))}
                </div>
            );
        } else {
            maybeDescription = (
                <p id="dashboard-description" dangerouslySetInnerHTML={
                    {__html: markdownParser.renderInline(props.description)}
                } />
            );
        }
    }

    if (props.metaDescription) {
        maybeMetaDescription = (
            <meta
                name="description"
                content={props.metaDescription}
            />
        );

        maybeGraphDescription = (
            <meta
                property="og:description"
                content={props.metaDescription}
            />
        );
    }

    let maybeRegion = null;
    const sortedRegions = bumpSort(props.regions, 'All');
    if (sortedRegions.length > 1) {
        maybeRegion = (
            <aside id="region">
                <div className="labelled-selector">
                    <label htmlFor="region-selector">Region</label>
                    <select id="region-selector" name="region" value={props.activeRegion} onChange={props.onRegionChange}>
                        {sortedRegions.map(regionName => (
                            <option key={regionName} value={regionName}>
                                {regionName}
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
                        activeRegion={props.activeRegion}
                        dashboardSource={props.dashboardSource}
                    />
                ))}
            </section>
        );
    } else {
        body = (
            <MetricOverviewCollection
                metrics={props.metrics}
                activeRegion={props.activeRegion}
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
                    {maybeRegion}
                </header>
                {maybeSummaryMetrics}
                <h3 id="metrics-heading">Metrics</h3>
                {body}
            </article>
        </React.Fragment>
    );
};
