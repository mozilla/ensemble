# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contact.spec.js >> All links work
- Location: tests/playwright/specs/contact.spec.js:18:1

# Error details

```
Error: https://discourse.mozilla.org/c/fx-public-data did not load successfully after 3 attempts
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - heading [level=1] [ref=e5]:
      - link "Firefox Public Data Report" [ref=e6] [cursor=pointer]:
        - /url: /
    - navigation [ref=e7]:
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "User Activity" [ref=e10] [cursor=pointer]:
            - /url: /dashboard/user-activity
        - listitem [ref=e11]:
          - link "Usage Behavior" [ref=e12] [cursor=pointer]:
            - /url: /dashboard/usage-behavior
        - listitem [ref=e13]:
          - link "Hardware" [ref=e14] [cursor=pointer]:
            - /url: /dashboard/hardware
        - listitem [ref=e15]:
          - link "Contact" [ref=e16] [cursor=pointer]:
            - /url: /contact
  - main [ref=e17]:
    - paragraph [ref=e18]:
      - text: Please use the
      - link "Firefox Public Data forum" [ref=e19] [cursor=pointer]:
        - /url: https://discourse.mozilla.org/c/fx-public-data
      - text: (requires sign-up) or email us at
      - link "fx-public-data@mozilla.com" [ref=e20] [cursor=pointer]:
        - /url: mailto:fx-public-data@mozilla.com
      - text: with any questions about this report. We will respond as soon as possible.
  - contentinfo [ref=e21]:
    - generic [ref=e22]:
      - link "Mozilla" [ref=e23] [cursor=pointer]:
        - /url: https://www.mozilla.org/
      - generic [ref=e24]:
        - heading "Mozilla" [level=3] [ref=e25]
        - navigation [ref=e26]:
          - list [ref=e27]:
            - listitem [ref=e28]:
              - link "About" [ref=e29] [cursor=pointer]:
                - /url: https://www.mozilla.org/about/
            - listitem [ref=e30]:
              - link "Contact Us" [ref=e31] [cursor=pointer]:
                - /url: https://www.mozilla.org/contact/
            - listitem [ref=e32]:
              - link "Donate" [ref=e33] [cursor=pointer]:
                - /url: https://donate.mozilla.org/
            - listitem [ref=e34]:
              - list [ref=e35]:
                - listitem [ref=e36]:
                  - link "Twitter (@mozilla)" [ref=e37] [cursor=pointer]:
                    - /url: https://twitter.com/mozilla
                - listitem [ref=e38]:
                  - link "Facebook (Mozilla)" [ref=e39] [cursor=pointer]:
                    - /url: https://www.facebook.com/mozilla
                - listitem [ref=e40]:
                  - link "Instagram (@mozillagram)" [ref=e41] [cursor=pointer]:
                    - /url: https://www.instagram.com/mozillagram/
      - generic [ref=e42]:
        - heading "Firefox" [level=3] [ref=e43]
        - navigation [ref=e44]:
          - list [ref=e45]:
            - listitem [ref=e46]:
              - link "Download Firefox Web browser" [ref=e47] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/new/
            - listitem [ref=e48]:
              - link "Desktop Browser for Mac, Window, Linux" [ref=e49] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/desktop/
            - listitem [ref=e50]:
              - link "Mobile Browser for Android" [ref=e51] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/android/
            - listitem [ref=e52]:
              - link "Mobile Browser for iOS" [ref=e53] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/ios/
            - listitem [ref=e54]:
              - list [ref=e55]:
                - listitem [ref=e56]:
                  - link "Twitter (@firefox)" [ref=e57] [cursor=pointer]:
                    - /url: https://twitter.com/firefox
                - listitem [ref=e58]:
                  - link "Facebook (Firefox)" [ref=e59] [cursor=pointer]:
                    - /url: https://www.facebook.com/Firefox
                - listitem [ref=e60]:
                  - link "YouTube (firefoxchannel)" [ref=e61] [cursor=pointer]:
                    - /url: https://www.youtube.com/firefoxchannel
    - generic [ref=e62]:
      - list [ref=e63]:
        - listitem [ref=e64]:
          - link "Privacy" [ref=e65] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/
        - listitem [ref=e66]:
          - link "Cookies" [ref=e67] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/websites/#cookies
        - listitem [ref=e68]:
          - link "Legal" [ref=e69] [cursor=pointer]:
            - /url: https://www.mozilla.org/about/legal/
        - listitem [ref=e70]:
          - link "Report Trademark Abuse" [ref=e71] [cursor=pointer]:
            - /url: https://www.mozilla.org/about/legal/fraud-report/
        - listitem [ref=e72]:
          - link "Contribute to this site" [ref=e73] [cursor=pointer]:
            - /url: https://github.com/mozilla/ensemble
      - paragraph [ref=e74]:
        - text: Portions of this content are ©1998–2026 by individual mozilla.org contributors. Content available under a
        - link "Creative Commons license" [ref=e75] [cursor=pointer]:
          - /url: https://www.mozilla.org/foundation/licensing/website-content/
        - text: .
```

# Test source

```ts
  1  | const { expect } = require('@playwright/test');
  2  | 
  3  | 
  4  | const acceptedHTTPStatusCodes = [200, 301, 302, 304];
  5  | 
  6  | // Loading a URL the React app manages itself doesn't return a 404 - it
  7  | // displays a "Not Found" message instead. External URLs are checked with a
  8  | // real request instead of a full navigation, retrying with backoff since
  9  | // external hosts occasionally hiccup.
  10 | async function loadsSuccessfully(page, url) {
  11 |     if (url.startsWith('mailto:')) return;
  12 | 
  13 |     if (new URL(url).origin === new URL(page.url()).origin) {
  14 |         await page.goto(url);
  15 |         await expect(page.locator('#not-found'), `Loaded successfully: ${url}`).not.toBeVisible();
  16 |         await page.goBack();
  17 |         return;
  18 |     }
  19 | 
  20 |     const maxAttempts = 3;
  21 |     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  22 |         const response = await page.request.get(url).catch(() => null);
  23 |         if (response && acceptedHTTPStatusCodes.includes(response.status())) return;
  24 | 
  25 |         if (attempt === maxAttempts) {
> 26 |             throw new Error(`${url} did not load successfully after ${attempt} attempts`);
     |                   ^ Error: https://discourse.mozilla.org/c/fx-public-data did not load successfully after 3 attempts
  27 |         }
  28 | 
  29 |         await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
  30 |     }
  31 | }
  32 | 
  33 | async function linkWorks(page, selector) {
  34 |     const href = await page.locator(selector).evaluate(el => el.href);
  35 |     await loadsSuccessfully(page, href);
  36 | }
  37 | 
  38 | async function linksWork(page, selector) {
  39 |     const hrefs = await page.locator(selector).evaluateAll(els => els.map(el => el.href));
  40 | 
  41 |     for (const href of hrefs) {
  42 |         await loadsSuccessfully(page, href);
  43 |     }
  44 | }
  45 | 
  46 | // If a test assumes that a certain number of elements exist, but a different
  47 | // number of elements exist, fail the test and explain why.
  48 | async function flagForUpdate(page, selector, collectiveName, numExpectedElements) {
  49 |     const numActualElements = await page.locator(selector).count();
  50 | 
  51 |     if (numActualElements !== numExpectedElements) {
  52 |         const isAreExpected = numExpectedElements === 1 ? 'is' : 'are';
  53 |         const isAreActual = numActualElements === 1 ? 'is' : 'are';
  54 | 
  55 |         throw new Error(`This test needs to be updated. It assumes that there ${isAreExpected} ${numExpectedElements} ${collectiveName}, but there ${isAreActual} actually ${numActualElements}.`);
  56 |     }
  57 | }
  58 | 
  59 | async function metricTitleIsCorrect(page, selector, title) {
  60 |     await expect(page.locator(selector)).toBeVisible();
  61 |     await expect(page.locator(selector)).toHaveText(title);
  62 | }
  63 | 
  64 | // Selecting a region triggers a refetch of every visible metric for the new
  65 | // region, but MetricOverviewContainer withholds its re-render until each
  66 | // fetch resolves (see its shouldComponentUpdate) - there's no DOM signal to
  67 | // wait on, only the underlying network requests.
  68 | async function changeRegionAndWaitForMetrics(page, index, numMetrics) {
  69 |     const region = await page.locator('#region-selector option').nth(index).getAttribute('value');
  70 | 
  71 |     let matched = 0;
  72 |     const metricsLoaded = page.waitForResponse(response => {
  73 |         if (response.ok() && response.url().includes(`/${region}/`)) {
  74 |             matched += 1;
  75 |         }
  76 |         return matched >= numMetrics;
  77 |     });
  78 | 
  79 |     await page.selectOption('#region-selector', { index });
  80 |     await metricsLoaded;
  81 | }
  82 | 
  83 | module.exports = {
  84 |     linkWorks,
  85 |     linksWork,
  86 |     flagForUpdate,
  87 |     metricTitleIsCorrect,
  88 |     changeRegionAndWaitForMetrics,
  89 | };
  90 | 
```