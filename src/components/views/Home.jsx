import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

import StripedHeader from './StripedHeader';
import { getPageTitle } from '../../lib/utils';

import './css/Home.css';


export default () => {
    const title = getPageTitle();
    const description = 'The Firefox Public Data Report is a weekly public report on the activity, behavior, and hardware configuration of Firefox users.';

    return (
        <React.Fragment>
            <Helmet>
                <title>{title}</title>
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta name="description" content={description} />
            </Helmet>
            <article id="introduction">
                <p className="highlighted">
                    {description}
                </p>
                <section id="purpose">
                    <h2 className="contrasted">Purpose</h2>
                    <span>The purpose of this report is twofold:</span>
                    <dl className="explanations split">
                        <div>
                            <dt><StripedHeader tag="h3" label="Empowerment" /></dt>
                            <dd>
                                We want to empower developers, journalists, and the overall
                                public to better understand the state of the web and the
                                direction of trends in web browsing.
                            </dd>
                        </div>
                        <div>
                            <dt><StripedHeader tag="h3" label="Transparency" /></dt>
                            <dd>
                                At Mozilla, we like to say that we are "Open by Design." We
                                believe in an open web, so data and insights from the public
                                should be made public, so the public can benefit.
                            </dd>
                        </div>
                    </dl>
                </section>
                <section id="content">
                    <h2 className="contrasted">Content</h2>
                    <span>The report is split into three sections:</span>
                    <dl className="explanations alt">
                        <div>
                            <dt><Link to="/dashboard/user-activity">User Activity</Link></dt>
                            <dd>Metrics for the the overall Firefox Desktop user population.</dd>
                        </div>
                        <div>
                            <dt><Link to="/dashboard/usage-behavior">Usage Behavior</Link></dt>
                            <dd>The ways in which Firefox Desktop is being used.</dd>
                        </div>
                        <div>
                            <dt><Link to="/dashboard/hardware">Hardware Across the Web</Link></dt>
                            <dd>The specs and configurations for the machines running Firefox Desktop.</dd>
                        </div>
                    </dl>
                </section>
                <section id="methodology">
                    <h2 className="contrasted">Methodology</h2>
                    <p>
                        All data is from a representative 10% sample from our
                        Release, Beta, ESR, and Other channels for Firefox and the
                        report runs once per week. Each datapoint covers a week's
                        worth of data (unless stated otherwise). All data is
                        anonymized and aggregated to ensure user privacy. Mozilla
                        publishes additional information about
                        {' '}its <a href="https://www.mozilla.org/privacy/">privacy policy</a>,
                        {' '}its <a href="https://www.mozilla.org/privacy/principles">privacy principles</a>,
                        {' '}its <a href="https://wiki.mozilla.org/Firefox/Data_Collection">data collection process</a>,
                        {' '}and its thoughts on <a href="https://www.mozilla.org/privacy/firefox/">internet privacy</a> in general.
                    </p>
                    <p>
                        You can learn more about this report by reading
                        {' '}<a href="https://blog.mozilla.org/blog/2018/08/28/lets-be-transparent/">our announcement on the Mozilla blog</a>
                        {' '}and by exploring the projects that power it:
                        {' '}<a href="https://github.com/mozilla/Fx_Usage_Report">FX_Usage_Report</a> (data processing and documentation),
                        {' '}<a href="https://github.com/mozilla/ensemble-transposer">ensemble-transposer</a> (formatting and metadata), and
                        {' '}<a href="https://github.com/mozilla/ensemble">ensemble</a> (data visualization).
                    </p>
                </section>
            </article>
        </React.Fragment>
    );
};
