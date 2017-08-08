import React from 'react';
import { Link } from 'react-router-dom';


export default () => (
    <article>
        <p>Ensemble is minimalist platform for publishing data. See the <a href="https://github.com/openjck/ensemble">GitHub project page</a> for more infomration.</p>
        <section>
            <h2>Example dashboards</h2>
            <nav>
                <ul>
                    <li><Link to="/dashboard/hardware">Hardware</Link></li>
                    <li><Link to="/dashboard/crashes">Crash rates</Link></li>
                </ul>
            </nav>
        </section>
    </article>
);
