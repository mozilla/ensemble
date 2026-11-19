# Make the first visit to a page paint and fill in sooner

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It is
maintained in accordance with `.claude/skills/execplans/references/PLANS.md`, including its
"Ensemble addendum", which overrides the upstream text where the two disagree.

## Purpose / Big Picture

A first-time visitor to <https://data.firefox.com/dashboard/user-activity> sees a blank white page
until about 200 KB of JavaScript has downloaded and run. Then they see a spinner while the page
fetches more code. Only after that does it start asking for the dashboard's data. On a slow phone
connection each of those steps is a visible wait, and they happen one after another. This is issue
#516 (<https://github.com/mozilla/ensemble/issues/516>), a list of routes to explore for faster
first loads.

After this work, the site header and navigation appear as soon as the stylesheet arrives, before any
JavaScript runs. The code for every page downloads alongside the main script instead of after it.
A dashboard's data request starts as soon as the main script runs, not after the dashboard's own
code has arrived. The fonts are requested with the HTML, not after the stylesheet has been parsed.
Each change is kept only if a before-and-after measurement shows it helps.

To see it working, build and serve the production bundle, open
<http://localhost:4173/dashboard/user-activity> in Chrome with DevTools' network throttling set to
"Slow 4G" and the cache disabled, and reload. The header shows up while the scripts are still
downloading. In the Network panel, the request for `user-activity/index.json` starts while the
`DashboardContainer-*.js` chunk is still downloading, not after it finishes.

Scope is "measure, then quick wins". These are out of scope and will be listed as follow-ups in
`Outcomes & Retrospective`:

- Prerendering pages at build time and switching React to hydrate them.
- Changing the CDN's cache headers.
- Asking the transposer to inline metric data into the dashboard file.
- A performance budget in CI.
- Replacing the dashboard-level spinner with a skeleton of the dashboard.

## Progress

- [x] (2026-11-18) Drafted the plan on branch `516--first-load-performance`, cut from
      `468--fresh-paint` (PR #512).
- [x] (2026-11-18) Milestone 1: baseline measured. Dashboard LCP median 5704 ms on a local
      build, 6888 ms on production. CLS on `/` is 0.686 locally and 0.563 on production. Findings
      and the re-ranked milestones are in Surprises and the Decision Log.
- [x] (2026-11-18) Milestone 2: `src/index.jsx` prefetches the dashboard's `index.json`.
      Dashboard LCP median went from 5704 to 4288 ms. Dashboard CLS rose from 0.098 to 0.247, from
      the font swap (see Surprises). Vitest 16 files, 141 tests. Recorded Playwright 122 passed.
      `early-data.spec.js` fails with the prefetch reverted.
- [x] (2026-11-19) Milestone 3: the plugin preloads the route chunks the main script imports
      directly, what they import, and their CSS. The fonts and the chart chunk are left out. `/` LCP
      went from 2248 to 2108 ms and dashboard LCP from 4532 to 3672 ms. FCP went from 1240 to
      1288 ms. Nothing is fetched twice. Vitest `indexHtmlPlugin.test.jsx` 4 tests.
- [x] (2026-11-18) Milestone 4, done before Milestone 3: `scripts/indexHtmlPlugin.mjs` puts the
      header and an empty `main` in `#root`, and `main` keeps a window's height while it is empty
      or holds only the page spinner. FCP went from 1692 to 1244 ms. CLS went from 0.686 to 0.052
      on `/` and from 0.247 to 0.052 on the dashboard. Dashboard LCP went from 4288 to 4540 ms (see
      Surprises). Vitest 17 files, 143 tests. Recorded Playwright 127 passed. Each of
      `shell.spec.js`'s tests fails with its change reverted.
- [x] (2026-11-18) Milestone 5, first item: fallback faces, Arial scaled with `size-adjust`. CLS
      went from 0.052 to 0.000 on both pages, with FCP and LCP unchanged. Recorded Playwright 133
      passed. `font-fallback.spec.js` fails without the faces, with shifts of 0.15 and 0.27 at
      412 px.
- [x] (2026-11-19) Milestone 5, analytics: `withTracker.jsx` loads nothing for the placeholder ID.
      With a real ID it initialises after `load` and sends page views only after that.
      `withTracker.test.jsx` has 4 tests, and 3 fail with the change reverted.
- [ ] Milestone 5, remaining: the late "Proceed to" button (0.046 CLS on dashboards), and the early
      metric requests, if they're still worth doing.
- [ ] Milestone 6: final measurement, clean-up, full test run, retrospective.

## Surprises & Discoveries

- Observation: production sends JavaScript and CSS uncompressed. Every `assets/` response from
  `data.firefox.com` arrives with no `content-encoding`, although the browser offered gzip, br and
  zstd. Its `transferSize` equals the raw file size: `index-*.js` 214 KB, `DashboardContainer-*.js`
  179 KB, `ChartContainer-*.js` 268 KB. The same build through `vite preview` transfers 70 KB,
  69 KB and 90 KB gzipped. The transposer's JSON is uncompressed too. On a slow connection this
  makes production's main script take 1.76 s to download, against 0.97 s for the local
  measurement. That makes it the largest single cost found, and it lives in the deploy, not the
  app. Production also shows `cache-control: public,max-age=0,immutable` on hashed assets, which
  confirms the CDN rewrite that `docs/architecture/deploy.md` describes.
  Evidence: `node scripts/measureLoad.js https://data.firefox.com 3 --headers`, every asset row
  `h2  -  public,max-age=0,immutable`, against `h2  zstd  private, max-age=900` for Google's gtag.
- Observation: production loads Google's gtag script for the placeholder measurement ID
  `G-XXXXXXXXXX` from `.env`, and sends page views to it. So the deploy sets no real ID. The script
  downloads from about 1.6 s to 3.9 s on the local build, alongside `DashboardContainer-*.js` and
  both fonts, which competes with them for bandwidth on a slow connection.
  Evidence: waterfall rows `/gtag/js?id=G-XXXXXXXXXX` and `/g/collect?...tid=G-XXXXXXXXXX` in both
  runs.
- Observation: on `/`, the footer jumps when the home page's content arrives, scoring 0.53 of CLS on
  its own. Google counts anything over 0.25 as poor. `main` is empty while the `Home` chunk loads,
  and the route spinner shows nothing for its first second, so the footer sits high on the screen
  until the content pushes it down. Production (`main` branch) shows the same 0.55 shift, so this
  isn't new on the fresh-paint branch.
  Evidence: local `/`: `shift @2227 0.5333 footer.c-footer`; production: `shift @3159 0.5497 footer`.
- Observation: the font swap causes the next-largest shifts. On `/`, 0.106 at 3532 ms lands just
  after Mozilla Text arrives (3518 ms), and 0.046 at 4083 ms just after Mozilla Headline arrives
  (4034 ms), moving `main` and the navigation. The dashboard shows the same 0.046 when Mozilla
  Headline arrives. Both fonts are discovered only after the CSS, at about 1.63 s.
- Observation: the dashboard request chain is as the issue describes, and each link costs about a
  second on a slow connection. On the local build:
  1. `index-*.js` ends at 1547 ms.
  2. `DashboardContainer-*.js` runs 1583–3993 ms.
  3. `user-activity/index.json` runs 4072–4765 ms. It starts only after the chunk.
  4. The metric files run 4780–5711 ms.
  5. LCP, a metric description paragraph, is at 5704 ms.

  `ChartContainer-*.js` (90 KB gzipped) doesn't start until 4060 ms, because it is imported by
  `MetricOverview.jsx` inside the dashboard chunk. A late `div.next-button` causes a further 0.046
  shift at 4798 ms.
- Observation: what the bundles hold, from `source-map-explorer` on a build with source maps:
  - The main bundle is 126 KB react-dom, 36 KB react-router, 14 KB react-helmet-async and 6 KB
    react-ga4.
  - The dashboard chunk is mostly markdown-it and its dependencies: markdown-it 50 KB, entities
    23 KB, linkify-it 11 KB and uc.micro 5 KB, about 90 KB raw. Then d3 at about 50 KB. Linkify is
    switched off in every markdown-it instance, but its code is bundled anyway.
  - The chart chunk is 183 KB Observable Plot, 41 KB chroma-js (pulled in by distinct-colors) and
    17 KB d3-scale-chromatic.

  Trimming these is a follow-up.
- Observation: starting the dashboard request early moved the font swap's reflow into the
  dashboard. After Milestone 2, `user-activity/index.json` runs 1593–2318 ms instead of
  4072–4765 ms. The metrics start at 3262 ms instead of 4780 ms, waiting now only on the dashboard
  chunk (ends 3215 ms), and LCP falls to 4288 ms. But the dashboard now renders before Mozilla Text
  arrives (3430 ms), so the swap reflows its description and pushes everything below. That's a
  new 0.20 shift whose sources are `section.metric-overview-collection` and `aside#region`, at
  3442 ms. The fonts have to arrive before the content, or the fallback has to take the same
  space. That makes Milestone 3's font preload and Milestone 5's fallback metrics more important,
  not less.
  Evidence: dashboard CLS runs `0.247` ×5 after, against `0.098` ×5 before. Single run: Mozilla
  Text `1644 - 3430`, then `shift @3442 0.2008 section.metric-overview-collection, aside#region`.
- Observation: preloading every chunk and both fonts from the HTML made things worse on a slow
  connection. Everything downloads at once, so `index-*.js` takes until 2532 ms instead of
  1547 ms. Before the page shell, nothing painted until that script ran. FCP went from 1692 to
  2652 ms. Dashboard LCP went from 4288 to 4644 ms. Dashboard CLS fell to 0, though, because the
  fonts arrived before the content. Variants measured by editing `build/index.html` by hand,
  median of 3:

      preloads (no shell)                       /: FCP  LCP   CLS     dashboard: LCP  CLS
      none                                         1692 2256  0.686              4280 0.247
      Mozilla Text only                            1868 2432  0.579              4380 0.046
      both fonts                                   2220 2796  0.481              4540 0.000
      Text + every chunk except the chart's        2288 2812  0.579              3956 0.092
      Text + dashboard and home chunks + CSS       2280 2504  0.579              3928 0.092

  With the shell in place, first paint depends only on the stylesheet, so the trade becomes LCP
  on `/` against LCP on dashboards. All routes get the same `index.html`, so preloading the
  dashboard's code slows the home page:

      preloads (with shell)                     /: FCP  LCP   CLS     dashboard: LCP  CLS
      none                                         1240 2260  0.052              4540 0.052
      Mozilla Text only                            1380 2424  0.052              4176 0.052
      Text + dashboard and home chunks + CSS       1424 2776  0.052              3832 0.098
      everything                                   1432 3656  0.013              4632 0.013

- Observation: the page shell makes the browser request both fonts as soon as the stylesheet is
  parsed (1208 ms), because the header's text needs them. Without it they were requested at about
  1630 ms. Their 103 KB then shares the connection with the dashboard chunk, which finishes 330 ms
  later (3542 ms, against 3215 ms). That is where the shell's 250 ms of extra dashboard LCP comes
  from. It is also why the 0.20 font-swap shift in the dashboard has gone: the fonts arrive before
  the dashboard renders. Mozilla Headline is 70 KB for the headings alone, which makes it a
  candidate for subsetting in a follow-up.
- Observation: what's left of CLS after the shell is two small shifts in the header:
  - 0.006 on the navigation items when Mozilla Text arrives;
  - 0.046 when Mozilla Headline arrives, because the `h1` changes height and moves `main` and the
    navigation.

  Both come from the fallback font taking a different amount of space, which is Milestone 5's
  first item.
- Observation: the Mozilla fonts are the same width at every weight. A line of the site's text at
  100 px measures 8428 px in Mozilla Text and 8123 px in Mozilla Headline, from weight 200 to 600.
  Arial measures 7702 px, and Arial Bold, which the browser uses from 600, measures 8243 px. So one
  `size-adjust` per family covers the regular weights, and Arial Bold needs its own face: 109.43%
  and 102.25% for Mozilla Text, 105.47% and 98.55% for Mozilla Headline. Both fonts have an ascent
  of .945 em, a descent of .255 em and no line gap, against Arial's .905, .212 and about .033.
  Evidence: DOM widths and canvas `measureText` in Chromium against the built WOFF2 files.
- Observation: `ascent-override`, `descent-override` and `line-gap-override` are not Baseline.
  Safari has never shipped them, and MDN's compat data lists Safari as "preview". So the fallback
  faces use `size-adjust` alone, which has been in Safari since 17. They still remove the shift.
  What moved before was width: the navigation wrapping differently. Line heights are mostly fixed
  in the stylesheet, so they don't move anything. Measured CLS fell from 0.052 to 0.000, and the
  spec's remaining shift is under 0.003.
- Observation: whether the old fallback shifted the page depends on the screen width. With the
  system font as the fallback (`-apple-system` on a Mac), the swap moved the page by under 0.01 at
  375 px and 1280 px, but by 0.15 on `/` and 0.27 on the dashboard at 412 px, where the navigation
  wraps onto a different number of lines. `font-fallback.spec.js` runs at 375, 412 and 1280 px for
  that reason.
- Observation: once the fallback faces stopped the swap from shifting anything, the fonts didn't
  need preloading, and the shell already requests them as soon as the stylesheet is parsed. Of
  the code preload sets measured with the shell and fallback faces in place (median of 5), the
  route chunks and their CSS won on both pages:

      preloads                                     /: FCP  LCP    dashboard: LCP  CLS
      none                                            1248 2260              4540 0.000
      dashboard and home chunks + CSS, by hand        1304 2180              3808 0.046
      the routes' chunks + imports + CSS (shipped)    1288 2108              3672 0.046

  The 0.046 is `div.next-button` appearing after the dashboard, now that the dashboard renders
  sooner.
- Observation: a per-route variant, an inline script choosing the preloads from
  `location.pathname`, never fired the page's load event in the measurement, even on `/`. It
  wasn't pursued: the static set already got most of the gain, and an inline script would need a
  hash in any future Content-Security-Policy.
- Observation: react-ga4 doesn't drop a `send` made before `initialize`. It pushes it onto
  `window.dataLayer`, ahead of the `js` and `config` commands that `initialize` adds. gtag reads
  `dataLayer` in order, so a page view sent before initialising would arrive before the
  configuration it needs. So `withTracker.jsx` sends each page view only once initialisation has
  finished.
  Evidence: `node_modules/react-ga4/dist/index.mjs`: `_gtag` calls the module's `gtag`, which
  creates `window.gtag` as a `dataLayer.push` when it is missing.
- Baseline, median of 5 cold loads on a local `vite preview` of this branch, and median of 3 on
  production (`main`). Slow 4G (562.5 ms latency, 1.44 Mbit/s down), 4× CPU slowdown, 412×915
  viewport, times in ms:

      page                       FCP    LCP    CLS     where
      /                          1684   2240   0.686   local build of this branch
      /dashboard/user-activity   1684   5704   0.098   local build of this branch
      /                          2524   3164   0.563   production, main
      /dashboard/user-activity   2512   6888   0.063   production, main

## Decision Log

- Decision: stack this branch on `468--fresh-paint` (PR #512) rather than on `main`.
  Rationale: #512 replaces the Fira Sans webfonts (WOFF, TTF and SVG, no `font-display`) with
  Mozilla Headline and Mozilla Text WOFF2 files that already use `font-display: swap`. Tuning the
  Fira faces would be thrown away when #512 merges. Every font measurement here is of the fonts that
  will ship. Rebase onto `main` once #512 merges, and onto `468--fresh-paint` whenever it changes
  before then.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: limit the scope to measuring and the low-risk changes. Prerendering, CDN headers,
  transposer changes and a CI budget become follow-ups.
  Rationale: each of the excluded items either needs another team (CDN, transposer) or changes how
  the app boots (hydration). They deserve their own plans once this one has shown where the time
  actually goes.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: the measurement script is throwaway. It isn't committed, and it's deleted in
  Milestone 6. Behaviour that can regress gets a committed Playwright spec or Vitest test instead.
  Rationale: timing numbers from a shared CI runner are too noisy to gate merges on. A spec that
  checks *order* (this request started before that one finished) or *presence* (these tags are in
  the HTML) is deterministic. `docs/execplans/2026-10-28-hardware-resize-performance.md` worked the
  same way.
  Date/Author: 2026-11-18, Stephanie Hobson.

- Decision: keep Milestones 2, 3 and 4, plus Milestone 5's font-fallback and analytics items.
  Leave Milestone 5's early metric requests until after Milestones 2 and 3 have been re-measured.
  Rationale: the baseline puts each of them on the critical path.
  - The dashboard JSON waits 2.4 s for a chunk it doesn't need (Milestone 2).
  - The chart chunk starts 2.5 s after it could, and the fonts start only after the CSS
    (Milestone 3).
  - First paint comes about 490 ms after the stylesheet is ready (Milestone 4).
  - The font swap shifts `/` by about 0.15 (Milestone 5).
  - gtag competes with the chunks for bandwidth (Milestone 5).

  Whether the metric requests still wait on the chunk depends on Milestones 2 and 3.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: fix the footer jump on `/` (CLS 0.53) in Milestone 4, by giving `main` a minimum height
  while a page is loading, in the app as well as in the static shell.
  Rationale: it is the largest layout shift measured and has nothing to do with fonts or data. It
  happens because `main` is empty, both before JavaScript runs and while a route chunk loads, so
  the shell and the loading state need the same fix.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: in Milestone 5, initialise Google Analytics only when `VITE_GA_MEASUREMENT_ID` is set to
  a real ID, not the checked-in `G-XXXXXXXXXX` placeholder. When a real ID is set, initialise it
  after the window's `load` event.
  Rationale: production loads gtag for the placeholder, so it downloads alongside the critical
  chunks and sends page views to nobody. This is the replacement for the plan's original "defer GA
  if it competes" item.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: serving compressed assets is a separate issue and pull request, not part of this plan.
  It means uploading with `gcloud storage cp --gzip-local-extensions=...` in
  `.github/workflows/deploy.yml`, and asking the CDN owners about brotli.
  Rationale: it changes what production and stage serve, and can only be verified after a deploy.
  This branch stays app-only. The compression finding stands: until it lands, production's numbers
  will stay behind the local build's.
  Date/Author: 2026-11-18, Stephanie Hobson.

- Decision: do Milestone 4 before Milestone 3, then Milestone 5's fallback font metrics, then choose
  the preloads.
  Rationale: until the page paints without JavaScript, every preload delays first paint, so
  preloads couldn't be judged fairly. With the shell, the remaining choice trades home-page LCP
  against dashboard LCP. Whether a font preload is needed at all depends on whether matching
  fallback metrics remove the swap shift.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: keep `main` at a window's height while it is empty (the shell) or holds only the page
  spinner, using `main:empty, main:has(> .spinner:only-child)` in `Application.styl`. The existing
  `main.dashboard-route` rule stays.
  Rationale: this is what removes the footer jump on `/`. `:has()` has been Baseline Widely
  available since 2026-06-19, according to webstatus.dev. Contact and Not Found keep their
  short-page layout once loaded, because the rule stops applying as soon as content renders.
  Date/Author: 2026-11-18, Stephanie Hobson.
- Decision: the shell is a wrapper with class `app-shell` that shares `#application`'s column
  styles. Its header is generated from `src/config.json`. `shell.spec.js` checks that it matches
  `views/Header.jsx`, both in markup (ignoring react-router's `data-discover`) and in position,
  at 375 and 1280 px.
  Rationale: the tests use `#application` as the sign that React has rendered, and the shell must
  not be mistaken for it. The development server adds styles with the scripts, so the position
  check swaps the shell back in after the styles have arrived, rather than measuring before
  JavaScript runs.
  Date/Author: 2026-11-18, Stephanie Hobson.

- Decision: the fallback faces use local Arial, Liberation Sans or Arimo, with `size-adjust` only.
  Rationale: Liberation Sans (most Linux systems, including CI's `playwright install --with-deps`)
  and Arimo (ChromeOS) were designed with Arial's metrics, so one set of values fits all three.
  Android has none of them and falls through to the system font as before. A system font can't
  be the base: `local()` can't name it reliably. If the webfonts fail to load entirely, text now
  shows in scaled Arial rather than the system font.
  Date/Author: 2026-11-18, Stephanie Hobson.

- Decision: preload the chunks the entry imports dynamically (the routes), their static imports,
  and their CSS. Don't preload the fonts or the chart chunk.
  Rationale: the measurements above. Preloading everything, or the chart's 90 KB, delays the main
  script on a slow connection. The fonts are discovered early anyway, thanks to the shell. The set
  is worked out from the bundle, not from a list of names, so a new route is covered without
  editing the plugin.
  Date/Author: 2026-11-19, Stephanie Hobson.

## Outcomes & Retrospective

Not started.

## Context and Orientation

The site is a client-rendered React 18 single-page app built with Vite. "Client-rendered" means the
HTML the server sends, `index.html` at the repository root, holds an empty `<div id="root">` and a
script tag. Everything visible is drawn by JavaScript after it downloads and runs. `src/index.jsx` is
the entry point. It calls React's `createRoot(...).render(...)`, and React replaces whatever is
inside `#root` when it first renders. The site has no data of its own. Every number comes from JSON
files under `https://data.firefox.com/datasets/`, written weekly by a separate project, the
transposer.

Issue #516 asks for an investigation of render-blocking requests, network request chains, font
loading, layout shifts, page skeletons and rehydration. It points out that the app has no server
rendering, so there is no rehydration today. It also suggests measuring a baseline before changing
anything.

These are the pieces of the repository this plan touches, and the terms it uses for them:

- **Route chunks and `lazyLoad`.** `src/components/views/Main.jsx` declares the routes (`/`,
  `/contact`, `/dashboard/<key>`, and a catch-all Not Found). It wraps each page component in
  `lazyLoad(() => import(...))` from `src/lib/lazyLoad.jsx`. Each `import()` becomes a separate
  JavaScript file, a *chunk*, in the build, such as `build/assets/DashboardContainer-<hash>.js`.
  `lazyLoad` calls the import **as soon as its module is evaluated**, not when the page is first
  shown. `src/components/views/MetricOverview.jsx` does the same for `ChartContainer`,
  `DataTableContainer` and `CustomizableDateContainer`. So every chunk is downloaded on every page,
  but none of them starts until the main script `index-<hash>.js` has finished downloading and
  started running. `src/lib/LazyBoundary.jsx` shows a spinner while a chunk is still loading.
- **The data layer, `withFetch` and `fetchCache`.** `src/lib/withFetch.jsx` wraps a container
  component and fetches the URL its function returns. `src/components/containers/DashboardContainer.jsx`
  fetches `${props.source}/index.json`, where `source` comes from the dashboard's entry in
  `src/config.json`. The function `cachedFetch(url)` in `withFetch.jsx`, not exported today, stores
  each request in the `Map` exported by `src/lib/fetchCache.js`. A later request for the same URL
  joins the one in flight or reuses its result, until the page reloads. So a request started early
  by other code is picked up by the container when it mounts, without a second network request.
- **The dashboard request chain.** On a first visit to a dashboard, the browser fetches in this
  order, with each step waiting on the one before:
  1. the HTML;
  2. `index-*.js`;
  3. the `DashboardContainer-*.js` chunk (about 178 KB on the last local build);
  4. the dashboard's `index.json`;
  5. one `index.json` per metric.

  Step 4 depends on nothing in step 3 except the URL, and that URL can be worked out from
  `src/config.json` and the page's path.
- **Data URLs are absolute.** The `source` values in `src/config.json` are full
  `https://data.firefox.com/...` URLs. In production they are same-origin. Locally and on stage they
  are cross-origin. `fetchJSON` in `withFetch.jsx` requests them with `mode: 'cors'` and
  `credentials: 'same-origin'`.
- **Styles and fonts.** Styles are written in Stylus under `src/components/views/styl/` and compiled
  to the gitignored `src/components/views/css/` by `npm run build:css`. `npm start` and
  `npm run build` both do this for you. Views import the compiled CSS. On this branch,
  `Application.styl` declares the `@font-face` rules for `Mozilla Headline VF` and `Mozilla Text VF`
  (WOFF2, `font-display: swap`). The fallback stack in `includes/lib.styl` is system UI fonts. Vite
  copies the font files into `build/assets/` with a content hash in the name. The browser only
  discovers it needs them after downloading and parsing the CSS, and only for text that is actually
  on screen.
- **Analytics.** `src/components/decorators/withTracker.jsx` calls `ReactGA.initialize` from
  react-ga4 when the module is evaluated. That adds Google's gtag script to the page. The checked-in
  `.env` holds a placeholder measurement ID.
- **Deploy.** `.github/workflows/deploy.yml` uploads `build/` to a Google Cloud Storage bucket
  behind Google's CDN. It copies the same `build/index.html` to each route path, so anything added
  to `index.html` applies to every page. `docs/architecture/deploy.md` records that the CDN rewrites
  every `cache-control` header to `public,max-age=0`, so even content-hashed assets are revalidated
  on each visit. That's a follow-up, not something this plan changes.
- **Web performance terms.**
  - *FCP* (First Contentful Paint) is when the first text or image appears.
  - *LCP* (Largest Contentful Paint) is when the largest one appears.
  - *CLS* (Cumulative Layout Shift) is a score for how much visible content jumps after it has
    appeared. 0 is perfect, and Google treats under 0.1 as good. The browser reports each shift as a
    `layout-shift` performance entry, naming the elements that moved.
  - A *preload* (`<link rel="preload">`) tells the browser to fetch a file now because it will be
    needed shortly. A *modulepreload* does the same for a JavaScript module, and also parses it.
  - A *render-blocking* request is a stylesheet or synchronous script in the head. The browser won't
    paint anything until it arrives.
- **Test helpers.**
  - `tests/playwright/fixtureData.js` exports a Playwright `test` that answers `data.firefox.com`
    requests from the recordings in `tests/playwright/fixtures/`, or passes them through to live
    data in the `live-data` project.
  - `holdRequests(page, matcher, handler)` in `tests/playwright/utils.js` pauses matching requests
    until the function it returns is called. `tests/playwright/specs/fixtures/placeholders.spec.js`
    shows it in use.
  - `tests/playwright/specs/jsDisabled.spec.js` runs with JavaScript off and asserts that
    `#application`, the root element `views/Application.jsx` renders, is absent. Any static markup
    added to `index.html` must not use that id.
  - Playwright runs against the Vite dev server (`npm start`, port 3000), not a production build.
    Vitest only runs files matching `src/tests/jest/**/*.test.jsx`.

## Plan of Work

### Milestone 1: measure the baseline (prototyping)

Nothing in the issue has been measured, so this milestone finds out where a first visit's time
actually goes, and decides which of the later milestones are worth doing.

Write a throwaway Node script, `scripts/measureLoad.js`. Don't commit it. Start it with
`/* eslint-disable no-console */`, because `npm run lint` lints every file in the tree and the
project forbids `console`. It uses `@playwright/test`'s
`chromium` launcher. For each of `/` and `/dashboard/user-activity`, it opens a fresh browser
context (so the cache is cold) and uses a CDP session to:

- emulate a slow mobile network: `Network.emulateNetworkConditions` with about 400 ms latency,
  about 400 kbit/s down and 400 kbit/s up, which is DevTools' "Slow 4G";
- slow the CPU fourfold with `Emulation.setCPUThrottlingRate`.

Before the page's own scripts run, it installs `PerformanceObserver`s through `page.addInitScript`
for `paint`, `largest-contentful-paint` and `layout-shift` (with `buffered: true`). It keeps each
layout shift's value and the elements in its `sources`. It waits until the last metric chart is on
screen, or for 5 seconds of network quiet on `/`. It then prints:

- FCP, LCP and total CLS;
- each layout shift with its sources;
- the waterfall: from `performance.getEntriesByType('resource')`, each request's name, `startTime`,
  `responseEnd` and `transferSize`.

Run each page five times and report medians.

Run it against a production build served locally: `npm run build`, then `npx vite preview --port
4173`, which serves `build/` with deep links working. Data comes from live `data.firefox.com`. Run
it once more against <https://data.firefox.com/> itself. Production serves `main` rather than this
branch, but that run records what only the real server can show: the response's
`content-encoding`, the HTTP protocol, and whether the gtag script loads and when. Also run
`npm run size` and note what the largest modules in the main bundle are.

Write the results into `Surprises & Discoveries` as a short table, and the per-step waterfall for
the dashboard. Then, in the `Decision Log`, state which of Milestones 2–5 the numbers justify. Drop
a milestone if its step isn't on the critical path. For example, if the dashboard chunk always
arrives before the data request would have finished anyway, Milestone 2 buys nothing.

Acceptance: the table exists, with medians for both pages, and each later milestone is either
confirmed or dropped with a reason. This milestone changes no committed code, so no documentation
goes stale.

### Milestone 2: start the dashboard data request at startup

In `src/lib/withFetch.jsx`, export a named function `prefetchJSON(url)` that calls `cachedFetch(url)`
and returns nothing. It must swallow its own rejection with `.catch(() => {})` so that a failure
isn't an unhandled rejection. `cachedFetch` already forgets a failed request, so the container's own
request retries and reports the error as it does today.

In `src/index.jsx`, before `createRoot(...)`, find the dashboard whose route matches
`window.location.pathname`. Use `matchPath` from `react-router` with the same
`/dashboard/${dashboard.key}` pattern `Main.jsx` uses, over `dashboards` from `src/config.json`. If
one matches, call `prefetchJSON(dashboardIndexUrl(dashboard.source))`. The URL must be built exactly
as `DashboardContainer.jsx` builds it, or the cache won't match. So add `dashboardIndexUrl(source)` to
`src/lib/utils.js` and use it in both places. It can't be exported from `DashboardContainer.jsx`
itself: importing that module from the entry would pull the dashboard chunk into the main bundle.

Add `tests/playwright/specs/fixtures/early-data.spec.js`. It holds the dashboard chunk with
`holdRequests(page, url => url.pathname.includes('DashboardContainer'))`. That matches
`/src/components/containers/DashboardContainer.jsx` on the dev server and the hashed chunk in a
build. It then visits `/dashboard/user-activity` and waits for a request whose path ends with
`user-activity/index.json`, using `page.waitForRequest`, while the chunk is still held. Then it
releases the chunk and checks that the dashboard renders its title. Revert the `index.jsx` change
and confirm the spec fails (the request never comes while the chunk is held), then restore it.

Add a Vitest case to the existing `src/tests/jest/withFetch.test.jsx`. It
stubs `window.fetch`, calls `prefetchJSON(url)`, awaits the response, then renders a component
wrapped by `withFetch` for the same URL. The component must render fulfilled on its first render,
and `fetch` must have been called once.

Docs: the data-layer paragraph in `AGENTS.md` and the matching text in
`docs/architecture/frontend.md` say `withFetch` is used in exactly three files. Add that
`src/index.jsx` starts the current dashboard's request through `prefetchJSON`. Re-run the
measurement and record the dashboard's change in `Surprises & Discoveries`.

Acceptance: `npm run test:jest` and `npm run test:playwright:recorded` pass, including the new spec,
and the spec fails with the change reverted. In the measurement, the dashboard `index.json` request
starts before the `DashboardContainer` chunk's `responseEnd`.

### Milestone 3: preload hints in the built `index.html`

Because `lazyLoad` starts every chunk anyway, telling the browser about them in the HTML costs no
extra bytes. It only moves their start from "after `index.js` runs" to "while the HTML is parsed".
The same goes for the fonts, which today wait for the CSS.

Create `scripts/indexHtmlPlugin.mjs`, exporting a default function that returns a Vite plugin. Add
it to `plugins` in `vite.config.mjs`. The plugin has a `transformIndexHtml` hook with
`order: 'post'`. When the hook's context has a `bundle`, which happens only in `vite build`, it
returns tags to inject into the head:

- `<link rel="modulepreload" href="/assets/<file>">` for every JavaScript chunk in the bundle except
  the entry chunk. Vite already preloads the entry and its static imports.
- `<link rel="preload" as="style" href="...">` for every CSS asset except the entry's stylesheet,
  which is already a `<link rel="stylesheet">`.
- `<link rel="preload" as="font" type="font/woff2" crossorigin href="...">` for the assets whose
  original names are `MozillaText-Variable.woff2` and `MozillaHeadline-Variable.woff2`. These are
  the upright faces almost every page uses. The italic files are left to load on demand.
  `crossorigin` is required on font preloads even for same-origin files, or the browser fetches the
  font twice.

Put the tag building in a separately exported pure function, `preloadTags(bundle)`. It takes Rollup's
bundle object (`{ fileName: { type: 'chunk' | 'asset', isEntry, fileName, names, ... } }`) and returns
Vite's `HtmlTagDescriptor` array. Test it from `src/tests/jest/indexHtmlPlugin.test.jsx` by
importing `../../../scripts/indexHtmlPlugin.mjs` and passing a hand-built bundle. Assert that the
entry chunk is skipped, that each other chunk gets a modulepreload, and that exactly the two
upright fonts get a font preload with `crossorigin`.

`eslint.config.js` gives Node and browser globals only to `.js` and `.jsx` files. A `.mjs` file
gets the shared rules but no globals, which is fine as long as the plugin uses only imports. If it
needs a Node global such as `process`, import it from `node:process` rather than widening the lint
config. Run `npm run build` and `grep -E 'modulepreload|as="font"' build/index.html`, and
confirm the hashed names match files in `build/assets/`. Re-measure.

Docs: `AGENTS.md`'s description of `vite.config.mjs` and `index.html`, and the deploy comment about
`index.html` being copied per route, stay accurate. Add one line to `AGENTS.md`'s project-structure
notes saying that `scripts/indexHtmlPlugin.mjs` injects preload hints at build time.

Acceptance: the Vitest file passes. The built `index.html` contains the tags. In the measurement the
chunks' `startTime` falls before `index.js`'s `responseEnd`, and the fonts start before the CSS
finishes.

### Milestone 4: static page shell in `index.html`

Give the browser something real to paint before any JavaScript runs: the site header and navigation,
which are the same on every page.

Extend `scripts/indexHtmlPlugin.mjs`. In both dev and build, `transformIndexHtml` replaces
`<div id="root"></div>` with a `#root` that already holds the shell, generated from
`src/config.json`. The shell is the same markup `src/components/views/Header.jsx` renders: a
`<header id="main-header">` with an `h1` link to `/` and a `nav#main-navigation` list linking to each
`/dashboard/<key>` with its `menuTitle`, then `/contact`. After the header comes an empty
`<main class="page-shell"></main>`.

The footer jump on `/` (see Surprises) has the same cause before and after JavaScript runs: `main`
has no height until a page's content arrives. Give `main` a minimum height in `Application.styl`
whenever it holds only the loading state or the shell, so that the footer starts below the fold on
a phone-sized screen. For example, a `min-height` in `vh` on `main` that is lifted once content has
rendered. Check how `main` is styled on this branch first, including the `dashboard-route` class and
the "short-page layout" that `Main.jsx` mentions, and keep the short-page layout of the Contact and
Not Found pages. Record what was chosen. The header's styles come from `Header.styl`. Check whether that CSS lands in the entry
stylesheet, which is render-blocking and in the head. If it doesn't, the shell paints unstyled, and
the fix is to import `Header.css` from `Application.jsx` so it does. Record which it was.

React replaces the shell on its first render, with the same header in the same place, so nothing
should move. Don't use `id="application"`.

Add `tests/playwright/specs/shell.spec.js` with:

- **A drift guard.** It fetches the raw HTML with `request.get('/')`, extracts the `#main-header`
  markup, loads `/`, and compares it with the rendered `#main-header`'s `outerHTML`. Normalise
  whitespace before comparing.
- **A CLS check.** On `/dashboard/user-activity` it collects `layout-shift` entries through
  `addInitScript`. It asserts that none of their sources lie inside `#main-header`.

In `jsDisabled.spec.js`, add a test that the nav links are visible with JavaScript off and point to
`/dashboard/user-activity`, `/dashboard/usage-behavior`, `/dashboard/hardware` and `/contact`.

Docs: `AGENTS.md` and `docs/architecture/frontend.md` both say `index.html` holds only the
`og:image`, `og:title` and `<noscript>`. Add the generated shell. Re-measure.

Acceptance: the new specs pass and the drift guard fails if `Header.jsx`'s markup is changed. In the
measurement, FCP comes before `index.js`'s `responseEnd`, with no new layout shifts.

### Milestone 5: fix what the measurements still show (conditional)

Each of these is done only if a measurement attributes a real cost to it. Otherwise it is skipped
with the reason in the `Decision Log`.

1. **Font swap shift.** If CLS of 0.01 or more comes from text reflowing when the Mozilla fonts
   replace the fallback, add a fallback `@font-face` in `Application.styl`. It uses `local()` with a
   common system font and sets `size-adjust`, `ascent-override` and `descent-override` so the
   fallback takes the same space. Put it in the stacks in `includes/lib.styl` straight after the
   webfont. Compute the overrides from the two fonts' metrics and record them.
2. **Analytics.** In `withTracker.jsx`, initialise react-ga4 only when
   `import.meta.env.VITE_GA_MEASUREMENT_ID` is set and isn't the placeholder `G-XXXXXXXXXX`. When it
   is a real ID, run `ReactGA.initialize` after the window's `load` event, or straight away if
   `document.readyState` is already `complete`. Keep the first page view. Check in
   `node_modules/react-ga4` whether `send` calls made before initialisation are queued or dropped,
   and record which. If they're dropped, send the first page view after initialising. With the
   placeholder, `send` must be a no-op that throws nothing. Test it in a new
   `src/tests/jest/withTracker.test.jsx` by mocking `react-ga4`.
3. **Early metric requests.** If the metric `index.json` requests still wait on the dashboard chunk
   after Milestones 2 and 3, extend the startup prefetch. When the dashboard file arrives, prefetch
   the metric URLs for the region `DashboardContainer` would choose. That's `preferredRegion` from
   `sessionStorage` if it is one of the dashboard's `categories`, otherwise `defaultCategory`. Move
   that choice into one shared function used by both, rather than copying it.

4. **Late "Proceed to" button.** If the 0.046 shift from `div.next-button` on the dashboard is
   still there after Milestones 2–4, reserve its space while the dashboard loads.

Each change made gets a spec or test that fails without it, and the docs it touches are updated in
the same commit.

### Milestone 6: wrap up

Re-run the measurement and put the final medians next to the baseline in `Outcomes &
Retrospective`. Delete `scripts/measureLoad.js`. List the follow-ups from `Purpose / Big Picture`,
plus anything the measurements turned up. Run the full validation below and record the actual
results. Draft a short results comment for #516 and show it to the user rather than posting it.

## Concrete Steps

All commands run from the repository root, `/path/to/ensemble`.

Set up, once per branch switch:

    nvm use
    npm install
    npx playwright install chromium

Measure, during Milestones 1 to 6. The second command keeps running, so use a second terminal for
the third:

    npm run build
    npx vite preview --port 4173
    node scripts/measureLoad.js http://localhost:4173
    node scripts/measureLoad.js https://data.firefox.com

Expect, per page, lines like these (the numbers here are placeholders):

    /dashboard/user-activity  FCP 2900  LCP 6100  CLS 0.02   (median of 5, ms)
      0     -  410   index.html
      430   - 2600   assets/index-XXXX.js
      2650  - 3900   assets/DashboardContainer-XXXX.js
      3950  - 4400   datasets/desktop/user-activity/index.json

Check after each milestone:

    npm run lint
    npm run test:jest
    npm run test:playwright:recorded

Check the build output after Milestone 3:

    npm run build
    grep -E 'modulepreload|as="font"' build/index.html

## Validation and Acceptance

When the work is complete:

- `npm run lint` reports no problems.
- `npm run test:jest` passes every file, including `withFetch.test.jsx` and
  `indexHtmlPlugin.test.jsx`.
- `npm run test:playwright:recorded` passes, including `fixtures/early-data.spec.js`,
  `shell.spec.js` and the new `jsDisabled.spec.js` test.
- `npm run test:playwright:live` passes. If it fails, say whether the cause was this branch or
  upstream data changing.
- `npm run build` succeeds.
- Each new spec and test has been seen to fail with its change reverted.

Behaviour a person can check: with `npx vite preview --port 4173` running and Chrome's DevTools on
"Slow 4G" with the cache disabled, load <http://localhost:4173/dashboard/user-activity>. The header
and navigation appear while the scripts are still downloading. The Network panel shows every
`assets/*.js` chunk and the two Mozilla fonts starting at about the same time as `index-*.js`, and
`user-activity/index.json` starting before `DashboardContainer-*.js` finishes. With JavaScript
disabled in DevTools, the header and its links still show, along with the "You need to enable
JavaScript" message.

The measurement table in `Outcomes & Retrospective` shows medians for FCP and LCP that are lower
than the baseline, and CLS that is no worse, on both pages.

## Idempotence and Recovery

Every step can be re-run. The measurement script writes nothing. The plugin's output is regenerated
on each build or dev-server start. If the shell or the preloads cause trouble in production, remove
the plugin from `plugins` in `vite.config.mjs`. That restores the old `index.html` exactly, without
touching anything else. The prefetch in `src/index.jsx` is one call, and removing it falls back to
the container's own request.

This branch is stacked on `468--fresh-paint`. When that branch changes, rebase with
`git rebase --onto mozilla/468--fresh-paint <old base> 516--first-load-performance`. Once #512 has
merged, rebase onto `mozilla/main` instead. Run `npm install` after either.

## Artifacts and Notes

None yet. Measurement tables and waterfalls go here and in `Surprises & Discoveries` as they're
produced.

## Interfaces and Dependencies

No new dependencies. The work uses Vite's plugin API (`transformIndexHtml`, which receives
`{ bundle }` in build), react-router's `matchPath`, and Playwright's `chromium` and CDP session for
measurement.

At the end of the work these exist:

- In `src/lib/withFetch.jsx`, `export function prefetchJSON(url)`. It starts or joins the cached
  request for `url` and returns nothing.
- In `src/lib/utils.js`, `export function dashboardIndexUrl(source)`, returning
  `${source}/index.json`. It is used by `DashboardContainer.jsx` and `src/index.jsx`.
- In `scripts/indexHtmlPlugin.mjs`:
  - `export default function indexHtmlPlugin()`, returning a Vite plugin;
  - `export function preloadTags(bundle)`, returning an array of
    `{ tag: 'link', attrs, injectTo: 'head' }`;
  - from Milestone 4, `export function shellHtml(dashboards)`, returning the shell markup string.
