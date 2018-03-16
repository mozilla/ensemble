import React from 'react';
import { Link } from 'react-router-dom';


export default () => (
    <article>
        <p>
            The Firefox Public Data Report is a weekly public report on the
            activity, behavior, and hardware configuration of Firefox users.
        </p>
        <p>
            The purpose of this report is twofold. One: empower developers,
            journalists, and the overall public to better understand the
            state of the web and the direction of trends in desktop web
            browsing. Two: transparency. We believe in an open web. Data
            from the public should go to the public, for the public.
        </p>
        <p>
            {/*
              * The wierd little {' '} things are needed in this paragraph
              * beacuse React doesn't add a space when a newline is immediately
              * followed by a component.
              *
              * https://github.com/facebook/react/issues/1643
              */}
            The report is split into 3 sections:{' '}

            <Link to="/dashboard/user-activity">User Activity</Link>,{' '}
            <Link to="/dashboard/usage-behavior">Usage Behavior</Link>, and{' '}
            <Link to="/dashboard/hardware">Hardware Across the Web</Link>.

            User Activity includes metrics for the the overall Firefox user
            population. Usage Behavior describes ways in which Firefox is being
            used. Hardware Across the Web details hardware specs and
            configurations for the machines running Firefox.
        </p>
        <p>
            All data is from a representative 1% sample from our Release
            channel and the report runs once a week. Each datapoint covers a
            week’s worth of data (unless stated otherwise). All data is
            anonymized and aggregated to ensure user privacy.
        </p>
    </article>
);
