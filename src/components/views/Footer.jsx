import React from 'react';

import './css/Footer.css';


export default class extends React.Component {
    componentDidMount() {
        let links = document.querySelectorAll('footer a');

        // IE doesn't support NodeList.forEach, so we need to convert links to
        // an array first.
        links = Array.from(links);

        links.forEach(anchor => {
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
        });
    }

    render() {
        return (
            <footer className="c-footer">
                <div>
                    <nav className="c-footer-primary">
                        <div className="c-footer-primary-logo">
                            <a href="https://www.firefox.com/">Firefox</a>
                        </div>
                        <div className="c-footer-sections">
                            <section className="c-footer-section">
                                <h3 className="c-footer-heading">Mozilla</h3>
                                <ul className="c-footer-list">
                                    <li><a href="https://www.mozilla.org/">Mozilla.org</a></li>
                                    <li><a href="https://www.mozilla.org/about/">About</a></li>
                                    <li><a href="https://donate.mozilla.org/">Donate</a></li>
                                    <li><a href="https://www.mozilla.org/privacy/principles/">Data Privacy Principles</a></li>
                                    <li>
                                        <ul className="c-footer-links-social">
                                            <li><a className="bluesky" href="https://bsky.app/profile/mozilla.org" translate="no">Bluesky<span> (@mozilla.org)</span></a></li>
                                            <li><a className="instagram" href="https://www.instagram.com/mozilla/">Instagram<span> (@mozilla)</span></a></li>
                                            <li><a className="linkedin" href="https://www.linkedin.com/company/mozilla-corporation/">LinkedIn<span> (@mozilla)</span></a></li>
                                            <li><a className="tiktok" href="https://www.tiktok.com/@mozilla">TikTok<span> (@mozilla)</span></a></li>
                                            <li><a className="spotify" href="https://open.spotify.com/show/0vT7LJMeVDxyQ2ZamHKu08?si=_uDRD6bRR_6M5YZyISGXgA">Spotify<span> (@mozilla)</span></a></li>
                                        </ul>
                                    </li>
                                </ul>
                            </section>
                            <section className="c-footer-section">
                                <h3 className="c-footer-heading">Firefox</h3>
                                <ul className="c-footer-list">
                                    <li><a href="https://www.firefox.com/">Download Firefox</a></li>
                                    <li><a href="https://www.firefox.com/firefox/notes/">Release Notes</a></li>
                                    <li><a href="https://support.mozilla.org/">Support</a></li>
                                    <li><a href="https://www.mozilla.org/privacy/firefox/">Firefox Privacy Notice</a></li>
                                    <li>
                                        <ul className="c-footer-links-social">
                                            <li><a className="bluesky" href="https://bsky.app/profile/firefox.com" translate="no">Bluesky<span> (@firefox.com)</span></a></li>
                                            <li><a className="instagram" href="https://www.instagram.com/firefox/">Instagram<span> (@firefox)</span></a></li>
                                            <li><a className="youtube" href="https://www.youtube.com/user/firefoxchannel">YouTube<span> (@firefoxchannel)</span></a></li>
                                            <li><a className="tiktok" href="https://www.tiktok.com/@firefox">TikTok<span> (@firefox)</span></a></li>
                                        </ul>
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </nav>

                    <nav className="c-footer-secondary">
                        <div className="c-footer-legal">
                            <p className="c-footer-license">
                                Portions of this content are ©1998–{new Date().getFullYear()} by individual mozilla.org contributors. Content available under a {' '}
                                <a href="https://www.mozilla.org/foundation/licensing/website-content/">Creative Commons license</a>.
                            </p>
                            <ul className="c-footer-terms">
                                <li><a href="https://www.mozilla.org/privacy/">Privacy</a></li>
                                <li><a href="https://www.mozilla.org/privacy/websites/#cookies">Cookies</a></li>
                                <li><a href="https://www.mozilla.org/about/legal/">Legal</a></li>
                                <li><a href="https://www.mozilla.org/about/legal/fraud-report/">Report Trademark Abuse</a></li>
                                <li><a href="https://github.com/mozilla/ensemble">Contribute to this site</a></li>
                            </ul>
                        </div>
                    </nav>
                </div>
            </footer>
        );
    }
}
