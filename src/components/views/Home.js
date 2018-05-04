import React from 'react';
import { Link } from 'react-router-dom';

import StripedHeader from './StripedHeader';

import './css/Home.css';


export default () => (
    <article id="introduction">
        <p className="highlighted">
            The Firefox Public Data Report is a weekly public report on the
            activity, behavior, and hardware configuration of Firefox Desktop
            users.
        </p>
        <h2 className="contrasted">The purpose of this report is twofold:</h2>
        <dl className="explanations split">
            <div>
                <dt><StripedHeader tag="h3" label="Empowerment" /></dt>
                <dd>
                    We want to empower developers, journalists, and the overall
                    public to better understand the state of the web and the
                    direction of trends in desktop web browsing.
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
        <h2 className="contrasted">The report is split into 3 sections:</h2>
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
        <p>
            All data is from a representative 10% sample from our Release, Beta,
            ESR, and Other channels for Firefox Desktop and the report runs once
            a week. Each datapoint covers a week's worth of data (unless stated
            otherwise). All data is anonymized and aggregated to ensure user
            privacy. Mozilla publishes additional information about
            {' '}its <a href="https://www.mozilla.org/privacy/">privacy policy</a>,
            {' '}its <a href="https://www.mozilla.org/privacy/principles">privacy principles</a>,
            {' '}its <a href="https://wiki.mozilla.org/Firefox/Data_Collection">data collection process</a>,
            {' '}and its thoughts on <a href="https://www.mozilla.org/privacy/firefox/">internet privacy</a> in general.
        </p>
        <p>
            You can learn more about this report by reading our announcement on
            the Mozilla blog.
        </p>
    </article>
);
