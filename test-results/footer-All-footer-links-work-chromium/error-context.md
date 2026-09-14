# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: footer.spec.js >> All footer links work
- Location: tests/playwright/specs/footer.spec.js:9:1

# Error details

```
Error: https://donate.mozilla.org/ did not load successfully after 3 attempts
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
    - article [ref=e18]:
      - paragraph [ref=e19]: The Firefox Public Data Report is a weekly public report on the activity, behavior, and hardware configuration of Firefox users.
      - generic [ref=e20]:
        - heading "Purpose" [level=2] [ref=e21]
        - text: "The purpose of this report is twofold:"
        - generic [ref=e22]:
          - generic [ref=e23]:
            - term [ref=e24]:
              - heading "Empowerment" [level=3] [ref=e25]
            - definition [ref=e27]: We want to empower developers, journalists, and the overall public to better understand the state of the web and the direction of trends in web browsing.
          - generic [ref=e28]:
            - term [ref=e29]:
              - heading "Transparency" [level=3] [ref=e30]
            - definition [ref=e32]: At Mozilla, we like to say that we are "Open by Design." We believe in an open web, so data and insights from the public should be made public, so the public can benefit.
      - generic [ref=e33]:
        - heading "Content" [level=2] [ref=e34]
        - text: "The report is split into three sections:"
        - generic [ref=e35]:
          - generic [ref=e36]:
            - term [ref=e37]:
              - link "User Activity" [ref=e38] [cursor=pointer]:
                - /url: /dashboard/user-activity
            - definition [ref=e39]: Metrics for the the overall Firefox Desktop user population.
          - generic [ref=e40]:
            - term [ref=e41]:
              - link "Usage Behavior" [ref=e42] [cursor=pointer]:
                - /url: /dashboard/usage-behavior
            - definition [ref=e43]: The ways in which Firefox Desktop is being used.
          - generic [ref=e44]:
            - term [ref=e45]:
              - link "Hardware Across the Web" [ref=e46] [cursor=pointer]:
                - /url: /dashboard/hardware
            - definition [ref=e47]: The specs and configurations for the machines running Firefox Desktop.
      - generic [ref=e48]:
        - heading "Methodology" [level=2] [ref=e49]
        - paragraph [ref=e50]:
          - text: All data is from a representative 10% sample from our Release, Beta, ESR, and Other channels for Firefox and the report runs once per week. Each datapoint covers a week's worth of data (unless stated otherwise). All data is anonymized and aggregated to ensure user privacy. Mozilla publishes additional information about its
          - link "privacy policy" [ref=e51] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/
          - text: ", its"
          - link "privacy principles" [ref=e52] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/principles
          - text: ", its"
          - link "data collection process" [ref=e53] [cursor=pointer]:
            - /url: https://wiki.mozilla.org/Firefox/Data_Collection
          - text: ", and its thoughts on"
          - link "internet privacy" [ref=e54] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/firefox/
          - text: in general.
        - paragraph [ref=e55]:
          - text: You can learn more about this report by reading
          - link "our announcement on the Mozilla blog" [ref=e56] [cursor=pointer]:
            - /url: https://blog.mozilla.org/blog/2018/08/28/lets-be-transparent/
          - text: "and by exploring the projects that power it:"
          - link "FX_Usage_Report" [ref=e57] [cursor=pointer]:
            - /url: https://github.com/mozilla/Fx_Usage_Report
          - text: (data processing and documentation),
          - link "ensemble-transposer" [ref=e58] [cursor=pointer]:
            - /url: https://github.com/mozilla/ensemble-transposer
          - text: (formatting and metadata), and
          - link "ensemble" [ref=e59] [cursor=pointer]:
            - /url: https://github.com/mozilla/ensemble
          - text: (data visualization).
    - link "Proceed to User Activity" [ref=e61] [cursor=pointer]:
      - /url: /dashboard/user-activity
  - contentinfo [ref=e62]:
    - generic [ref=e63]:
      - link "Mozilla" [ref=e64] [cursor=pointer]:
        - /url: https://www.mozilla.org/
      - generic [ref=e65]:
        - heading "Mozilla" [level=3] [ref=e66]
        - navigation [ref=e67]:
          - list [ref=e68]:
            - listitem [ref=e69]:
              - link "About" [ref=e70] [cursor=pointer]:
                - /url: https://www.mozilla.org/about/
            - listitem [ref=e71]:
              - link "Contact Us" [ref=e72] [cursor=pointer]:
                - /url: https://www.mozilla.org/contact/
            - listitem [ref=e73]:
              - link "Donate" [ref=e74] [cursor=pointer]:
                - /url: https://donate.mozilla.org/
            - listitem [ref=e75]:
              - list [ref=e76]:
                - listitem [ref=e77]:
                  - link "Twitter (@mozilla)" [ref=e78] [cursor=pointer]:
                    - /url: https://twitter.com/mozilla
                - listitem [ref=e79]:
                  - link "Facebook (Mozilla)" [ref=e80] [cursor=pointer]:
                    - /url: https://www.facebook.com/mozilla
                - listitem [ref=e81]:
                  - link "Instagram (@mozillagram)" [ref=e82] [cursor=pointer]:
                    - /url: https://www.instagram.com/mozillagram/
      - generic [ref=e83]:
        - heading "Firefox" [level=3] [ref=e84]
        - navigation [ref=e85]:
          - list [ref=e86]:
            - listitem [ref=e87]:
              - link "Download Firefox Web browser" [ref=e88] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/new/
            - listitem [ref=e89]:
              - link "Desktop Browser for Mac, Window, Linux" [ref=e90] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/desktop/
            - listitem [ref=e91]:
              - link "Mobile Browser for Android" [ref=e92] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/android/
            - listitem [ref=e93]:
              - link "Mobile Browser for iOS" [ref=e94] [cursor=pointer]:
                - /url: https://www.mozilla.org/firefox/ios/
            - listitem [ref=e95]:
              - list [ref=e96]:
                - listitem [ref=e97]:
                  - link "Twitter (@firefox)" [ref=e98] [cursor=pointer]:
                    - /url: https://twitter.com/firefox
                - listitem [ref=e99]:
                  - link "Facebook (Firefox)" [ref=e100] [cursor=pointer]:
                    - /url: https://www.facebook.com/Firefox
                - listitem [ref=e101]:
                  - link "YouTube (firefoxchannel)" [ref=e102] [cursor=pointer]:
                    - /url: https://www.youtube.com/firefoxchannel
    - generic [ref=e103]:
      - list [ref=e104]:
        - listitem [ref=e105]:
          - link "Privacy" [ref=e106] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/
        - listitem [ref=e107]:
          - link "Cookies" [ref=e108] [cursor=pointer]:
            - /url: https://www.mozilla.org/privacy/websites/#cookies
        - listitem [ref=e109]:
          - link "Legal" [ref=e110] [cursor=pointer]:
            - /url: https://www.mozilla.org/about/legal/
        - listitem [ref=e111]:
          - link "Report Trademark Abuse" [ref=e112] [cursor=pointer]:
            - /url: https://www.mozilla.org/about/legal/fraud-report/
        - listitem [ref=e113]:
          - link "Contribute to this site" [ref=e114] [cursor=pointer]:
            - /url: https://github.com/mozilla/ensemble
      - paragraph [ref=e115]:
        - text: Portions of this content are ©1998–2026 by individual mozilla.org contributors. Content available under a
        - link "Creative Commons license" [ref=e116] [cursor=pointer]:
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
     |                   ^ Error: https://donate.mozilla.org/ did not load successfully after 3 attempts
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