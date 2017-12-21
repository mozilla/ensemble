import React from 'react';
import { Link } from 'react-router-dom';


const exampleFormatURL = 'http://ensemble-transposer.herokuapp.com/firefox-hardware-report/'
const registrationLink = 'mailto:data-tools@mozilla.com?subject=Ensemble%20registration&body=Shortname%20(your%20dashboard%20will%20be%20hosted%20at%20/dashboards/[shortname]):%0A%0AJSON%20URL%20for%20your%20data:';

export default () => (
    <article>
        <section id="introduction">
            <h2>What is Ensemble?</h2>
            <p>
                Ensemble is a minimalist platform for publishing data dashboards.
                You can think of it like <a href="https://readthedocs.org/">Read
                the Docs</a> for data. Just publish your data somewhere in our
                standard JSON format (<a href={exampleFormatURL}>example</a>),
                register it with this service, and you'll have your very own
                dashboard.
            </p>
        </section>

        <section id="register">
            <h2>Register your data</h2>
            <p>
                Registration is currently being done over email. To create a
                dashboard, please <a href={registrationLink}>email us some basic
                information</a> and we'll add a dashboard for your data as soon
                as possible.
            </p>
        </section>

        <section id="example-dashboards">
            <h2>Dashboards</h2>
            <nav>
                <ul>
                    <li><Link to="/dashboard/hardware">Firefox Hardware Report</Link></li>
                </ul>
            </nav>
        </section>
    </article>
);
