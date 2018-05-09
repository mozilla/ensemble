import React from 'react';


export default () => {
    return (
        <footer>
            <div className="footer-primary">
                <a className="footer-logo" href="https://www.mozilla.org/" target="_blank" rel="noopener noreferrer">Mozilla</a>
                <ul>
                    <li><h3>Mozilla</h3></li>
                    <li>
                        <a href="https://www.mozilla.org/about/" target="_blank" rel="noopener noreferrer">About</a>
                    </li>
                    <li>
                        <a href="https://www.mozilla.org/contact/" target="_blank" rel="noopener noreferrer">Contact Us</a>
                    </li>
                    <li><a href="https://donate.mozilla.org/" target="_blank" rel="noopener noreferrer">Donate</a></li>
                    <li>
                        <a href="https://wiki.mozilla.org/Webdev/GetInvolved/mozilla.org" target="_blank" rel="noopener noreferrer">
                            Contribute to this site
                        </a>
                    </li>
                    <li className="footer-social">
                        <a href="https://twitter.com/mozilla" target="_blank" rel="noopener noreferrer">Twitter <span>(@mozilla)</span></a>
                        <a href="https://www.facebook.com/mozilla" target="_blank" rel="noopener noreferrer">Facebook <span>(Mozilla)</span></a>
                        <a href="https://www.instagram.com/mozillagram/" target="_blank" rel="noopener noreferrer">
                            Instagram <span>(@mozillagram)</span>
                        </a>
                    </li>
                </ul>
                <ul>
                    <li><h3>Firefox</h3></li>
                    <li><a href="https://www.mozilla.org/firefox/new/" target="_blank" rel="noopener noreferrer">Download Firefox Web browser</a></li>
                    <li>
                        <a href="https://www.mozilla.org/firefox/desktop/" target="_blank" rel="noopener noreferrer">
                            Desktop Browser for Mac, Window, Linux
                        </a>
                    </li>
                    <li>
                        <a href="https://www.mozilla.org/firefox/android/" target="_blank" rel="noopener noreferrer">
                            Mobile Browser for Android
                        </a>
                    </li>
                    <li><a href="https://www.mozilla.org/firefox/ios/" target="_blank" rel="noopener noreferrer">Mobile Browser for iOS</a></li>
                    <li className="footer-social">
                        <a href="https://twitter.com/firefox" target="_blank" rel="noopener noreferrer">Twitter <span>(@firefox)</span></a>
                        <a href="https://www.facebook.com/Firefox" target="_blank" rel="noopener noreferrer">Facebook <span>(Firefox)</span></a>
                        <a href="https://www.youtube.com/firefoxchannel" target="_blank" rel="noopener noreferrer">YouTube <span>(firefoxchannel)</span></a>
                    </li>
                </ul>
            </div>
            <div className="footer-secondary">
                <ul>
                    <li><a href="https://www.mozilla.org/privacy/" target="_blank" rel="noopener noreferrer">Privacy</a></li>
                    <li><a href="https://www.mozilla.org/privacy/websites/#cookies" target="_blank" rel="noopener noreferrer">Cookies</a></li>
                    <li><a href="https://www.mozilla.org/about/legal/" target="_blank" rel="noopener noreferrer">Legal</a></li>
                    <li><a href="https://www.mozilla.org/about/legal/fraud-report/" target="_blank" rel="noopener noreferrer">Report Trademark Abuse</a></li>
                </ul>
                <p>Portions of this content are ©1998–2018 by individual mozilla.org contributors. Content available under a {' '}
                <a href="https://www.mozilla.org/foundation/licensing/website-content/" target="_blank" rel="noopener noreferrer">Creative Commons license</a>.</p>
            </div>
        </footer>
    );
};
