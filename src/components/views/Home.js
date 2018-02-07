import React from 'react';
import { Link } from 'react-router-dom';


export default () => (
    <article>
        <section id="dashboards">
            <h2>Dashboards</h2>
            <nav>
                <ul>
                    <li><Link to="/dashboard/hardware">Hardware</Link></li>
                    <li><Link to="/dashboard/usage">Usage</Link></li>
                </ul>
            </nav>
        </section>
    </article>
);
