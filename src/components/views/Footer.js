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
            <footer>
                <div className="footer-primary">
                    <a className="footer-logo" href="https://www.mozilla.org/">Mozilla</a>

                    <div>
                        <h3>Mozilla</h3>
                        <nav>
                            <ul>
                                <li><a href="https://www.mozilla.org/about/">About</a></li>
                                <li><a href="https://www.mozilla.org/contact/">Contact Us</a></li>
                                <li><a href="https://donate.mozilla.org/">Donate</a></li>
                                <li>
                                    <a href="https://wiki.mozilla.org/Webdev/GetInvolved/mozilla.org">
                                        Contribute to this site
                                    </a>
                                </li>
                                <li className="footer-social">
                                    <ul>
                                        <li><a href="https://twitter.com/mozilla">Twitter <span>(@mozilla)</span></a></li>
                                        <li><a href="https://www.facebook.com/mozilla">Facebook <span>(Mozilla)</span></a></li>
                                        <li>
                                            <a href="https://www.instagram.com/mozillagram/">
                                                Instagram <span>(@mozillagram)</span>
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    <div>
                        <h3>Firefox</h3>
                        <nav>
                            <ul>
                                <li><a href="https://www.mozilla.org/firefox/new/">Download Firefox Web browser</a></li>
                                <li>
                                    <a href="https://www.mozilla.org/firefox/desktop/">
                                        Desktop Browser for Mac, Window, Linux
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.mozilla.org/firefox/android/">
                                        Mobile Browser for Android
                                    </a>
                                </li>
                                <li><a href="https://www.mozilla.org/firefox/ios/">Mobile Browser for iOS</a></li>
                                <li className="footer-social">
                                    <ul>
                                        <li><a href="https://twitter.com/firefox">Twitter <span>(@firefox)</span></a></li>
                                        <li><a href="https://www.facebook.com/Firefox">Facebook <span>(Firefox)</span></a></li>
                                        <li><a href="https://www.youtube.com/firefoxchannel">YouTube <span>(firefoxchannel)</span></a></li>
                                    </ul>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>

                <div className="footer-secondary">
                    <ul>
                        <li><a href="https://www.mozilla.org/privacy/">Privacy</a></li>
                        <li><a href="https://www.mozilla.org/privacy/websites/#cookies">Cookies</a></li>
                        <li><a href="https://www.mozilla.org/about/legal/">Legal</a></li>
                        <li><a href="https://www.mozilla.org/about/legal/fraud-report/">Report Trademark Abuse</a></li>
                    </ul>
                    <p>Portions of this content are ©1998–{new Date().getFullYear()} by individual mozilla.org contributors. Content available under a {' '}
                    <a href="https://www.mozilla.org/foundation/licensing/website-content/">Creative Commons license</a>.</p>
                </div>

            </footer>
        );
    }
}
