# Draw the line charts with Observable Plot instead of metrics-graphics

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

This document follows `.claude/skills/execplans/references/PLANS.md` and must be maintained in accordance with it, including its "Ensemble addendum".

## Purpose / Big Picture

Every line chart on data.firefox.com is drawn by `metrics-graphics` 2.15.6. That library is abandoned. Its last stable release bundles its own copy of d3 version 4, and its only newer release is a 3.0 beta from 2022 that was never finished. Keeping it costs the project three things. It ships a second, older copy of d3 alongside the d3 version 7 modules the summary bars already use. Its CSS needs local workarounds for bugs that were fixed upstream but never released. And its nested `d3-transition` breaks the charts whenever an `npm update` or `npm dedupe` reshuffles the lockfile.

After this change, the charts are drawn by Observable Plot (`@observablehq/plot`), a maintained charting library from the d3 authors that is built on d3 version 7. A visitor sees the same charts: the same lines in the same colors and order, the same legend below each chart, the same dashed annotation markers, the same y-axis bounds and units, and the same "January 4, 2026: 1,000" readout at the top of a chart while hovering. Three things change, on purpose:

- Charts no longer animate when they redraw.
- Clicking a chart pins the hover readout until the next click. This is Observable Plot's built-in behavior.
- A metric with no plottable data shows a short message instead of a "Load error" box.

`metrics-graphics` and its d3 4 are gone from `package.json` and the lockfile.

To see it working, run `npm start`, open `http://localhost:3000/dashboard/user-activity`, and hover over a chart. Then open `http://localhost:3000/dashboard/hardware`, which has the most populations per chart, and change the region.

## Progress

- [x] (2026-11-05) Milestone 1 (prototyping): Plot 0.6.18 installed. It renders in jsdom, and hover works the same in Chromium and Firefox. Baselines recorded in Artifacts and Notes. The spike code was deleted.
- [x] (2026-11-05) Milestone 2: every line chart draws with Observable Plot. Vitest has 15 files and 92 tests, recorded Playwright has 78 tests, and lint is clean. Resizing the hardware dashboard is about 100× faster (see Artifacts and Notes).
- [x] (2026-11-05) Milestone 3: `metrics-graphics`, its d3 4, and `d3-shape` are uninstalled. `d3-scale` and `d3-selection` are pinned to the patch versions d3 7 uses, so each is installed once. `npm test` passes.
- [x] (2026-11-05) Outcomes & Retrospective written.

## Surprises & Discoveries

- Observation: metrics-graphics draws only the annotation markers that fall inside the plotted date range. It also moves overlapping marker labels apart. Observable Plot does neither: any x value in any mark widens the x scale's domain.
  Evidence: `node_modules/metrics-graphics/dist/metricsgraphics.js` has `mg_in_range` (about line 3512), used to filter markers, plus the label-placement code near lines 3557–3577.

- Observation: a population whose points are all null keeps its legend entry but has no line. So "path N is population N" does not hold.
  Evidence: `src/tests/jest/ChartContainer.test.jsx`, "A population whose points are all null keeps its legend entry and passes an empty series".

- Observation: metrics-graphics sorts each line's points by date before drawing (`x_sort: true` by default). `ChartContainer` keeps the order the data arrives in, and the data is not always in date order. Observable Plot joins points in the order it receives them, so unsorted data would make a line double back across time.
  Evidence: `node_modules/metrics-graphics/dist/metricsgraphics.js`, about line 719 (`x_sort: true`) and line 4615. A scan of the `type: 'line'` metrics in `tests/playwright/fixtures/**/index.json` finds 22 populations whose dates both rise and fall. They include every User Activity chart (MAU, average daily usage, intensity, latest version, new users) in both recorded regions, plus Usage Behavior's locale and add-on charts.

- Observation: Plot's `dy` is one value for the whole mark, not a per-datum channel. So one `Plot.text` mark cannot put different labels on different rows.
  Evidence: Observable Plot's mark options: `dx` and `dy` are constant options. The Milestone 1 spike confirmed the workaround. Plot applies `dy` as a `transform` on the mark's `<g>` (`translate(0.5,-39.5)` and `translate(0.5,-24.5)` for `dy` of -40 and -25), and each `<text>` keeps the same `y="0.71em"`. Tests that check label rows must read the group's `transform`, not the text's `y`.

- Observation: Plot labels each axis with its channel name unless told otherwise, so a chart shows "↑ y" and "x →".
  Evidence: a screenshot of the Milestone 1 spike on `/dashboard/hardware`. Set `label: null` on both scales, except where the y unit is shown as a label.

- Observation: installing Plot left metrics-graphics' d3 4 tree as it was. `node_modules/d3` is still 4.13.0, with its own nested `d3-transition` 1.1.1 and `d3-selection` 1.3.0. Plot's d3 7 installs under `node_modules/@observablehq/plot/node_modules/`. The October hoisting breakage did not recur, so metrics-graphics keeps working until Milestone 3 removes it.
  Evidence: `find node_modules -path '*d3-transition/package.json'` and the matching `d3-selection` search, after `npm install --save-exact @observablehq/plot@0.6.18`.

- Observation: metrics-graphics had four visible defaults that Plot does not share, and that this plan first missed. It shades the area under a single-population chart (`area: true`, drawn only when there is one line, fill `#0000ff` at 0.2 opacity). It draws 3 y ticks (`yax_count: 3`), abbreviated ("200M"), and 6 x ticks (`xax_count: 6`). Its lines are thinner. And on a multi-line chart its readout starts with the hovered population's name in that line's color ("de — June 17, 2024: 11.340%"). Milestone 2 reproduces all four.
  Evidence: side-by-side screenshots of the base and this branch. `node_modules/metrics-graphics/dist/metricsgraphics.js` lines 698–755 and 4847, and `metricsgraphics.css` (`path.mg-main-area`, `.mg-area1-color`).

- Observation: a `.8rem` annotation label is 20px tall in Fira Sans, so label rows must be 20px apart, not 16px.
  Evidence: `getBoundingClientRect()` on the labels at 375px wide showed 20px-high boxes on rows 16px apart.

- Observation: Plot's pointer does not respond in the chart's margins outside the plotting area. After a click unpins the readout, it updates only on the next pointer move.
  Evidence: the Playwright corner and click cases in `fixtures/region-data.spec.js`. The corner case hovers just inside the plotting area, after scrolling the chart into view.

- Observation: the first HTML readout moved the page on hover, in two ways. When empty, it was 21.6px tall (`min-height: 1.5em`). When filled, it took the page's 28px `line-height`, which pushed the chart down 6.4px. Fixing the height with `white-space: nowrap` caused a second shift. A long population name then widened the chart's container to 628px on a 375px screen, the legend reflowed from 104px to 38px tall, and the next metric jumped 66px. `.chart-readout` now has a fixed 28px height and line-height, `nowrap` with an ellipsis, and `contain: inline-size`, so its text cannot size anything around it. stylint doesn't know `contain`, so that line carries `// @stylint ignore`.
  Evidence: the "hovering and clicking a chart doesn't move anything on the page" cases in `fixtures/region-data.spec.js`, at 1280px and 375px, fail without these styles and pass with them.

- Observation: drawing with Plot makes resizing the hardware dashboard about 100 times faster, in both browsers.
  Evidence: the five-step resize timings in Artifacts and Notes, 55,375 ms down to 559 ms in Chromium and 66,761 ms down to 720 ms in Firefox.

- Observation: the manual resize protocol is impractical. A scripted run of 23 viewport steps × 3 runs on the hardware dashboard kept Chromium's renderer at 100% CPU for over 15 minutes without finishing the first browser. Each resize step takes seconds, which is #409.
  Evidence: `ps` showed `chrome-headless-shell` at 99.8% CPU. The run was stopped and replaced by the five-step protocol under Concrete Steps.

## Decision Log

- Decision: use Observable Plot rather than plain d3 modules, Chart.js, or the metrics-graphics 3.0 beta.
  Rationale: chosen by the user on 2026-11-05. Plot draws SVG, like metrics-graphics, so the Playwright specs keep working on SVG elements and line strokes. It is built on d3 7, which the summary bars already use, so the app ends up with one d3. Chart.js draws to canvas, which would mean rewriting every chart assertion. The 3.0 beta is unmaintained and breaks the 2.x API anyway.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: render the legend as React markup in `views/Chart.jsx` instead of having the chart library write into an empty `.legend` div.
  Rationale: metrics-graphics writes the legend itself, into `<div className="legend" />` in `views/MetricOverview.jsx`, which it finds by the selector in the `legendTarget` prop. Plot has no equivalent for a legend outside the SVG. React markup is simpler and testable in jsdom. The `.legend` class and its `span` children stay, so the styles and the `.legend span` locators keep working.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: keep the hover readout at the top of the chart (date, colon, value), not Plot's floating tooltip (`Plot.tip`).
  Rationale: visitors see it today, it never covers the lines, and `region-data.spec.js` asserts its text.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: accept that charts stop animating on redraw, and that a click pins the readout.
  Rationale: Plot replaces the whole SVG on each render and has no transitions. Animation was cosmetic, and dropping it removes the `d3-transition` dependency that broke the charts in October 2026. Click-to-pin is built into `Plot.pointer` and cannot be turned off without reimplementing the pointer. If the user objects to either, it is a separate change.
  Date/Author: 2026-11-05, Stephanie Hobson (confirmed by the user).

- Decision: a metric with no plottable points shows "No data to show for this metric." in place of the chart.
  Rationale: today metrics-graphics throws on an empty chart, and the error boundary shows "Load error". `boundaries.spec.js` pins that as current behavior, not as a design. Plot would draw an empty frame with nonsense ticks, because the y bounds are Infinity and -Infinity. A plain message is clearer. It is a user-visible copy change, confirmed by the user.
  Date/Author: 2026-11-05, Stephanie Hobson (confirmed by the user).

- Decision: identify lines in tests by color and legend entry, never by index.
  Rationale: empty populations keep a legend entry and a color but draw no path (see Surprises & Discoveries). Color is the visitor's own link between a line and its legend entry, so asserting on it tests what matters.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: measure the #409 resize path before and after, but do not fix it here.
  Rationale: #409 (the hardware dashboard redraws slowly on resize) has its own branch. A measured regression must still be investigated and reported to the user before this work merges.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: work on the placeholder branch `observable-plot-charts` until there is an issue, then rename it `<issue>--observable-plot-charts`.
  Rationale: chosen by the user on 2026-11-05. `AGENTS.md` names branches after issues, and no issue exists for this work yet. When one does, restate it in Context and Orientation.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: test the drawn chart in Vitest rather than mocking the chart component.
  Rationale: the Milestone 1 spike showed Plot renders real SVG in jsdom: paths with `stroke` attributes, `className` on each mark's `<g>`, rules, and `svg.scale('y').domain`. Pointer hover cannot be triggered in jsdom, so the readout stays a Playwright concern.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: measure resize with a Playwright script over five widths, one run per browser, instead of dragging the window by hand while profiling.
  Rationale: a script gives the same steps before and after, and runs in Chromium and Firefox without a person at the keyboard. The longer 23-step protocol does not finish in reasonable time on the base branch (see Surprises & Discoveries).
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: render the hover readout as HTML above the chart, from `ObservablePlot.jsx`, instead of as a Plot text mark.
  Rationale: the readout names the hovered population in its line's color, followed by the date and value in black. A Plot text mark has one fill and cannot measure text to place a second mark beside it. Plot reports the hovered point as the SVG's `value` and fires an `input` event. `ObservablePlot` keeps that point in its own state and redraws the SVG only when `options` change, so hovering never rebuilds the chart.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: keep `assignMarkerRows` private to `Chart.jsx` and test it through the drawn labels.
  Rationale: `AGENTS.md` keeps named exports to `lib/utils.js`. The Vitest and Playwright label cases check the rows it produces.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: rewrite `docs/architecture/frontend.md`'s "dependency ceiling" paragraph in Milestone 2, not Milestone 3. Also remove that file's bullet about a `suggestedMax` typo in `Chart.jsx`.
  Rationale: Milestone 2's grep acceptance covers that file, and the paragraph named `views/MetricsGraphics.jsx`. The typo was already fixed in `c8422fb`, and the rewrite removes the lines the bullet cites. The bullet about `SummaryMetric.jsx`'s arrow threshold in the same list was also fixed earlier (`96b5afc`) and is left for a separate docs pass.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: bump ensemble's exact pins from `d3-scale` 4.0.2 to 4.0.3 and from `d3-selection` 3.0.0 to 3.0.1, and uninstall `d3-shape`.
  Rationale: Plot's d3 7.9.2 requires 4.0.3 and 3.0.1. With the old pins, npm installed a second copy of each under Plot. Matching patch versions leaves one copy. Nothing in `src/` imports `d3-shape` now that Plot takes the curve by name.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: also remove metrics-graphics from `.github/dependabot.yml` (an ignore rule), `.claude/skills/update-deps/denied.md` (a denied update), and `public/contribute.json` (a keyword, replaced by `observable-plot`). Also drop `docs/architecture/frontend.md`'s note about a `d3-color` advisory.
  Rationale: the whole-tree grep in Milestone 3 found them. The `d3-color` advisory came from d3 4, and `npm audit` no longer reports it.
  Date/Author: 2026-11-05, Stephanie Hobson.

- Decision: stack the branch on `react-18-upgrade`.
  Rationale: `views/MetricsGraphics.jsx`, the single place metrics-graphics is called, only exists on that branch chain (itself stacked on `deps`). On `main`, `Chart.jsx` still imports `react-metrics-graphics`.
  Date/Author: 2026-11-05, Stephanie Hobson.

## Outcomes & Retrospective

Every line chart now draws with Observable Plot 0.6.18. The lines, colors, legend, markers, y-axis bounds and units, and hover readout match the metrics-graphics charts, checked side by side on the User Activity, Usage Behavior, and Hardware dashboards. The deliberate changes landed as planned. Charts don't animate, a click pins the readout, and a metric with no data says "No data to show for this metric." metrics-graphics, d3 4, its nested `d3-transition`, and the `d3-color` advisory are gone. The app now has one copy of each d3 module.

The unplanned result is the most useful one. Resizing the hardware dashboard went from about 55 seconds to about half a second in Chromium, and from 67 seconds to 0.7 seconds in Firefox, for the same five steps. That is most of #409's complaint. The unthrottled resize listener in `ChartContainer.jsx` is still there, and #409's own plan should start from these numbers. The lazy chart chunk shrank from 492 kB to 265 kB (154 kB to 90 kB gzipped).

Tests grew from 84 to 92 in Vitest and from 70 to 78 recorded Playwright cases. `Chart.test.jsx` now asserts on the drawn SVG instead of on an options object.

Lessons. The plan's first draft treated "same chart" as lines, colors, and hover. It missed metrics-graphics' quieter defaults: the area fill, tick counts and formats, line weight, and the colored name in the readout. Only side-by-side screenshots found those. The two reviews before execution found real problems: unsorted dates on every User Activity chart, and labels that one text mark could not stagger. Both would have shipped. The Milestone 1 spike confirmed them cheaply.

## Context and Orientation

The app is a React 18 single-page app built with Vite. It fetches all its data at runtime from data.firefox.com. Read `AGENTS.md` at the repository root for the conventions. The parts that matter here follow. All paths describe the `react-18-upgrade` branch.

The container/view split: files in `src/components/containers/` hold state and fetching, and render a matching file in `src/components/views/` with props already formatted. The chart path is:

1. `src/components/views/MetricOverview.jsx` renders one metric: a heading, a description, then `<div className="metric-and-legend">` holding the chart and an empty `<div className="legend" />`. Both are block-level siblings, so the legend sits below the chart. `src/components/views/styl/MetricOverview.styl` makes each direct child div of `.metric-and-legend` a centered, wrapping flex row (`.metric-and-legend > div`), so legend entries wrap side by side under the chart. `src/lib/LazyBoundary.jsx` renders `Suspense` inside an error boundary and adds no DOM element. `MetricOverview` lazy-loads `ChartContainer` for metrics whose `type` is `'line'` and passes `legendTarget={`#${props.identifier} .legend`}`, `data`, `axes`, `annotations`, and `numPopulations`.
2. `src/components/containers/ChartContainer.jsx` turns `data.populations` (an object from population name to `[{ x: dateString, y: number|null }]`) into `data`, a two-dimensional array of `{ x: Date, y }` with nulls dropped and populations sorted by their highest y, highest first. A population that is all nulls becomes an empty array and still gets a legend entry. It also builds `legend` (names in the same order) and `markers` (`{ x: Date, label }` from `annotations`). It measures the width of `#application > main` and calls `setState` with a new size on every window `resize`, unthrottled, for every chart. It renders nothing until the width is known, with a comment explaining that this avoids an animation on first load.
3. `src/components/views/Chart.jsx` computes:
   - the y range (`min_y`, `max_y`, padded and clamped, honoring `suggestedYMin` and `suggestedYMax`);
   - the units (a `%` unit is appended to y ticks, and any other unit becomes a y-axis label with an 80px left margin, a workaround for metrics-graphics issue 838);
   - the hover text (`x_mouseover` gives "January 4, 2026: " in UTC via `dateformat`, and `y_mouseover` gives the value through `prettifyNumber` from `src/lib/utils.js` plus the unit);
   - the colors (metrics-graphics' built-in palette for up to 11 populations, and above that one color per population from `distinct-colors`);
   - the curve (`curveCatmullRom.alpha(0.5)` from `d3-shape`).

   It imports `metrics-graphics/dist/metricsgraphics.css`, `./css/Chart.css`, and `./css/Metric.css`, and renders `views/MetricsGraphics.jsx` inside `<div className="metric chart">`.
4. `src/components/views/MetricsGraphics.jsx` is a class component that calls `MG.data_graphic({ ...props, target })` into a ref'd div on mount and on every update.

How metrics-graphics looks today, to be reproduced. The values come from `node_modules/metrics-graphics/dist/metricsgraphics.css` and `.js`; copy them before Milestone 3 deletes the package.

- The line palette (`.mg-line1-color` to `.mg-line10-color`) is `#4040e8`, `#05b378`, `#db4437`, `#f8b128`, `#5c5c5c`, `steelblue` (`#4682b4`), `#f673bf`, `#0b73b0`, `#006400`, `#92514f`. An eleventh population falls back to `.mg-line-color`, which is black (`#000`).
- Marker rules are `stroke: #b3b2b2` with `stroke-dasharray: 3,1`. Marker labels are `font-size: .8rem`, black, `opacity: .6`, at the top of the chart, and only markers inside the data's date range are drawn.
- The hover readout (`.mg-active-datapoint`) is black, `.9rem`, weight 400. Today `src/components/views/styl/Chart.styl` lifts it 50px (`.mg-active-datapoint-container { transform: translate(0, -50px); }`) to work around metrics-graphics issue 839.
- The hover picks the point nearest the cursor across all lines, anywhere in the chart, using an invisible Voronoi overlay.

Styles are Stylus. Edit `src/components/views/styl/*.styl`. The compiled `src/components/views/css/` is gitignored, and `npm run build:css` writes it. Vitest fails to resolve the CSS imports on a fresh clone until it has run. stylint runs with zero tolerance: CSS-like syntax, 4-space indent, `.9rem` not `0.9rem`, no `!important`, lowercase-dash names.

The summary bars (`src/components/views/SummaryMetric.jsx`) use `d3-scale` and `d3-selection` directly and are not part of this change.

The tests that touch charts:

- `src/tests/jest/Chart.test.jsx` (Vitest) mocks `views/MetricsGraphics` and asserts on the metrics-graphics options `Chart.jsx` computes. Its more-than-11-colors case passes `numPopulations: 12` with only two series of data.
- `src/tests/jest/ChartContainer.test.jsx` mocks `views/Chart` and asserts on its props. Only its header comment names metrics-graphics.
- The Playwright locators that use metrics-graphics class names, all in `tests/playwright/specs/`:
  - `path.mg-main-line` in `dashboards/hardware.spec.js`, `dashboards/user-activity.spec.js`, `dashboards/usage-behavior.spec.js`, `fixtures/chart-series.spec.js`, and `fixtures/boundaries.spec.js`.
  - `path.mg-main-line.mg-lineN` and `.mg-lineN-legend-color` in `fixtures/chart-series.spec.js`.
  - `path.mg-line1` in `fixtures/user-activity.spec.js`, at about lines 21, 30, and 39.
  - `.mg-active-datapoint` in `fixtures/region-data.spec.js`.
  - `circle.mg-line-rollover-circle.mg-line1` and `path.mg-main-line.mg-line2` in `fixtures/boundaries.spec.js`.

  `fixtureData.js`'s `test` fails a spec on any page or console error.

Docs that describe metrics-graphics:

- `AGENTS.md`: the class-component list, the "Styles attach via" bullet (Chart's CSS imports), the "Comments must stand on their own" bullet (which uses "the `metrics-graphics` workaround notes in `views/Chart.jsx`" as its example), "Testing data shaping", "Testing chart views", the `path.mg-line1` footgun row, and the #409 bullet ("the d3/metrics-graphics redraw path").
- `CONTRIBUTING.md`: the same topics, around lines 67, 134, 160–164, and 264.
- `docs/architecture/frontend.md`: "The dependency ceiling on modernizing this application".

Terms used below:

- A "population" is one line on a chart: one named series, such as a region, a GPU vendor, or an OS.
- "Recorded mode" is the Playwright project that serves data from `tests/playwright/fixtures/` instead of the network. CI requires it.
- "The pointer transform" is Observable Plot's `Plot.pointer`, explained under Interfaces and Dependencies.

## Plan of Work

### Milestone 1 (prototyping): prove Observable Plot fits, and take baselines

Scope: answer two questions with throwaway code, and record the numbers later milestones compare against.

1. Does Plot render real SVG in Vitest's jsdom, so `Chart.test.jsx` can assert on the drawn chart? Plot's documentation shows it running under jsdom, so expect yes.
2. Does the pointer readout behave like today's in Chromium and Firefox? That means nearest point across all lines, anywhere in the frame, and text at the top that does not collide with marker labels.

Work:

1. Install `@observablehq/plot` at exactly `0.6.18` with `npm install --save-exact`.
2. Write a scratch Vitest file, `src/tests/jest/PlotSpike.test.jsx`. Render a two-population `Plot.line` with `className: 'chart-line'` and a `Plot.ruleX` marker. Assert that `g.chart-line path` has two elements with `stroke` attributes, and that `svg.scale('y').domain` equals the domain passed in. Also confirm the two failure cases Milestone 2 guards against. First, a population with shuffled dates draws a path that doubles back unless sorted first. Second, two `Plot.text` marks with different `dy` values put labels on separate rows.
3. Temporarily swap `views/MetricsGraphics.jsx`'s body for a Plot call with the pointer dot and readout described in Milestone 2. Hover the user-activity charts in `npm start`, in Chromium and Firefox.
4. On the base branch, before the swap, take the baselines described under Concrete Steps: the chart chunk's size, and a resize profile of the hardware dashboard in Chromium and Firefox.

Promote or discard:

- If jsdom renders the SVG, Milestone 2 tests the drawn DOM.
- If it fails, find out why (for example, a missing DOM method that a small stub fixes) before falling back. Only fall back if there is no fix. The fallback is today's pattern: mock `views/ObservablePlot` and assert on the options it receives. Record the outcome in the Decision Log.
- Delete the spike test and revert the swap. Keep the `package.json` and lockfile change.
- Record the baselines in Artifacts and Notes.

Acceptance: the spike test result and its reason are recorded, the readout has been seen working in both browsers, and the baselines are written down. Nothing user-visible changes, and no docs go stale.

### Milestone 2: draw every line chart with Observable Plot

Scope: at the end, every line chart is an Observable Plot SVG, and no source file, style, test, or doc refers to metrics-graphics. The package itself is still installed.

1. Add `src/components/views/ObservablePlot.jsx` and delete `views/MetricsGraphics.jsx`. The new file is a class component with a ref'd `<div className="observable-plot">`. In `componentDidMount` and `componentDidUpdate`, it calls `Plot.plot(this.props.options)` and puts the result in the div with `replaceChildren`. In `componentWillUnmount`, it empties the div. It is a class because `AGENTS.md` reserves classes for refs and lifecycle.

2. Rewrite `src/components/views/Chart.jsx` to build Plot options. Keep the y-range arithmetic, the `spacelessUnits` and `appendableUnits` handling, the `distinct-colors` settings, and their comments. Reword the 10% padding comment: the padding stays as headroom above the highest line, but the comment should no longer blame metrics-graphics. Delete the issue-838 comment with the workaround it explains. The options:

   - Points: sort each population's points by `x`, oldest first, then flatten `props.data` into `points`, a list of `{ x, y, population }` in legend order. Empty populations contribute nothing. The sort matters: metrics-graphics sorted each line by date itself, the data does not always arrive in date order, and Plot joins points in the order given. Do the sort in `Chart.jsx`, next to the flattening, with a comment saying why. A copy sorted with `toSorted` leaves `props.data` untouched.
   - x scale: `x: { type: 'utc', domain: [earliest x in points, latest x in points] }`. The domain is set from the data so that markers cannot widen it.
   - Markers: filter `props.markers` to those inside that domain, matching today.
   - y scale: `y: { domain: [minYToShow, maxYToShow] }`. Add `tickFormat: d => d + '%'` for appendable units. For other units, add `label: props.yUnit`, `labelAnchor: 'center'`, `labelArrow: 'none'`, and `marginLeft: 80`, so the label has room. That margin is ordinary layout now, not a workaround.
   - Colors: `color: { domain: props.legend, range: palette }`. `palette` is the 11 colors from Context and Orientation, in a constant named `paletteForUpToElevenPopulations`, or the `distinct-colors` list when `numPopulations` is above 11. The domain is the full legend, including empty populations, so every population keeps the color it has today.
   - Top margin: set `marginTop` large enough for the readout on top and every marker-label row below it. Today's 50px lift of the readout is the starting value for one label row.
   - Marks, in this order:
     1. `Plot.ruleX(markersInRange, { x: 'x', stroke: '#b3b2b2', strokeDasharray: '3,1', className: 'chart-marker' })`.
     2. Marker labels, as one `Plot.text` mark per row, because Plot's `dy` is one value for a whole mark. A small pure function in `Chart.jsx`, `assignMarkerRows(markers, xScaleWidth)`, gives each marker a row number. A label that would start within an estimated label width of the previous label in the same row moves to the next row down. Estimate the width from the label's length times an average character width at `.8rem`, and use the chart's pixel width to convert dates to positions. Then, for each row `rowIndex`, add `Plot.text(markersInRow, { x: 'x', text: 'label', frameAnchor: 'top', dy: firstLabelRowOffset + rowIndex * labelRowHeight, className: 'chart-marker-label' })`. `marginTop` grows by `labelRowHeight` for each row past the first.
     3. `Plot.line(points, { x: 'x', y: 'y', z: 'population', stroke: 'population', curve: 'catmull-rom', className: 'chart-line' })`. Plot's `'catmull-rom'` curve is d3's `curveCatmullRom` with its default alpha of 0.5, the same curve as today.
     4. `Plot.dot(singlePoints, { x: 'x', y: 'y', fill: 'population', r: 3, className: 'chart-point' })`, for populations with exactly one point, which a line cannot show.
     5. `Plot.dot(points, Plot.pointer({ x: 'x', y: 'y', stroke: 'population', maxRadius: hoverRadius, className: 'chart-hover-point' }))`.
     6. `Plot.text(points, Plot.pointer({ px: 'x', py: 'y', frameAnchor: 'top', dy: readoutRowOffset, text: readout, maxRadius: hoverRadius, className: 'chart-readout' }))`.
   - Hover: `hoverRadius` is one shared constant, `Math.hypot(props.width, props.height)`. Any point in the frame is then within range of some datum, as with today's Voronoi hover, and both pointer marks always pick the same datum. `readout` joins the existing `x_mouseover` and `y_mouseover` text, so the strings carry over unchanged.
   - SVG: `width`, `height`, `className: 'chart-svg'`, and `style: { fontFamily: 'inherit' }`, so the axes use Fira Sans like the rest of the page.

3. Render the legend in `Chart.jsx`. It returns a fragment: `<div className="metric chart"><ObservablePlot options={...} /></div>`, then, when `showLegend` is true, `<div className="legend">` with one `<span className="legend-entry" style={{ color }}>— {populationName}</span>` per population, empty ones included. In `views/MetricOverview.jsx`, stop rendering the empty `<div className="legend" />` for line charts. Keep it for tables only if removing it changes their layout. Drop the `legendTarget` prop in `MetricOverview.jsx` and `ChartContainer.jsx`. Because `LazyBoundary` adds no element, both divs stay direct children of `.metric-and-legend`, and the existing styles apply. Check the legend's wrapping and centering against the base branch at 375px, 768px, and 1400px wide.

4. When `points` is empty, render `<p className="chart-empty">No data to show for this metric.</p>` in place of the chart and legend.

5. Update `src/components/containers/ChartContainer.jsx`:
   - Fix the `memoizeMarkers` comment that says "MG requires that the name of this property matches the value of x_accessor". The marks read `x`; say that.
   - Reword the render-guard comment. Waiting for the measured width no longer prevents an animation. It prevents drawing the chart twice, once at the default width and once at the real width.

6. Styles. Remove the `metricsgraphics.css` import from `Chart.jsx`. Replace the issue-839 workaround in `src/components/views/styl/Chart.styl` with the readout and marker-label type styles from Context and Orientation, targeting `.chart-readout text` and `.chart-marker-label text`, and anything else needed to match the base branch side by side.

7. Rewrite `src/tests/jest/Chart.test.jsx`, keeping every current case's intent: bounds, suggested min and max, units, UTC readout text, legend shown and hidden, markers, more than 11 colors, and empty data. With the DOM approach from Milestone 1:
   - Read bounds from `svg.scale('y').domain`, not from tick labels, because ticks need not land on the domain's ends.
   - Assert y tick text ends in `%` for a `%` unit, and that the axis label text appears for other units.
   - Assert `.legend-entry` text and order, and that each line's `stroke` equals its legend entry's color.
   - Assert that an out-of-range marker is not drawn. Assert that two markers a day apart land in different `g.chart-marker-label` groups, with different `y` positions, and that three neighboring markers at 375px wide use three rows.
   - Pass a population whose points are shuffled out of date order. Assert that the drawn path's x coordinates only increase (parse the `d` attribute's move and curve points), and that `props.data` is unchanged afterward.
   - Unit-test `assignMarkerRows` directly: labels far apart share row 0, and close labels move down.
   - Assert the `chart-empty` message.
   - For more than 11 colors, render 12 real populations, not two, and check 12 distinct strokes that each match their legend entry.
   - Add a case with an empty population between two populated ones. It keeps its legend entry and color, and the other two lines keep theirs.

   The readout text can't be triggered in jsdom, so test the string through the same exported-for-test path the current tests use, or leave it to Playwright. Update the header comment in `ChartContainer.test.jsx`.

8. Update the Playwright specs. Every locator listed in Context and Orientation changes:
   - `path.mg-main-line` and the bare `path.mg-line1` become `g.chart-line path`.
   - `.mg-active-datapoint` becomes `g.chart-readout text`.
   - The single-point dot becomes `g.chart-point circle`.
   - In `chart-series.spec.js`, find each population's line by its legend entry's color, not by index. Keep its order and position assertions.
   - Keep `.filter({ visible: true })` only where the new selector can still match hidden elements. Check that in the browser.

   New and changed cases:
   - `region-data.spec.js`: hover near the higher line and expect exactly its value, then near the lower line and expect its value. This proves the readout picks the nearest point, not just either value. Also hover a frame corner and expect a readout. Move the mouse off the chart and expect the readout to clear. Click, move, and expect the readout to stay pinned.
   - `boundaries.spec.js`: keep the single-point case. Change the all-null case to expect `.chart-empty` with its message and no `svg`, and remove its `allowedErrors`, because nothing throws now. Add a recovery case: serve all-null data for the default region and real data for Germany, switch to Germany, and expect lines and no `.chart-empty`.
   - Add a case to `chart-series.spec.js` with an empty population among populated ones. It appears in the legend, and every drawn line's color matches its legend entry.
   - Add a markers case: serve a metric with one annotation inside the date range and one outside. Expect one `g.chart-marker line` and one label, and expect the readout and the label not to overlap (compare their bounding boxes). Add a second case with three annotations a week apart at a 375px viewport, and expect no two label bounding boxes to overlap.
   - Add a date-order case to `chart-series.spec.js`: serve one population with its dates shuffled. Expect the line's points, read from its bounding box and from hovering left to right, to move forward in time, with the readout dates increasing as the mouse moves right.

9. Update the docs this milestone makes wrong, in this milestone:
   - In `AGENTS.md` and `CONTRIBUTING.md`: the class-component list, Chart's CSS imports, "Testing data shaping", and "Testing chart views".
   - The "Comments must stand on their own" example. Its metrics-graphics workaround comments are gone, so pick another real example or drop the sentence.
   - The footgun row, rewritten for `g.chart-line path`, or deleted if no trap remains.
   - The #409 bullet, which becomes "the chart redraw path".
   - `docs/architecture/frontend.md`'s mention of `views/MetricsGraphics.jsx`.

10. Repeat the resize measurement from Milestone 1 on this branch, in both browsers, and record the numbers next to the baseline. If either browser is slower by more than the run-to-run spread, find out where the time goes and report it to the user before merging. Fixing it belongs to #409 unless the cause is in this change.

Acceptance:

- `npm run lint` is clean.
- `npm run test:jest` passes.
- `npm run test:playwright:recorded` passes.
- `git grep -n -i "metrics-graphics\|metricsgraphics\|mg-" -- src tests AGENTS.md CONTRIBUTING.md docs/architecture` finds nothing.
- Side by side with the base branch, the user-activity and hardware dashboards show the same lines, colors, legend, markers, and readout.
- The resize numbers are recorded.

### Milestone 3: remove the metrics-graphics package

Scope: at the end, `metrics-graphics` and d3 4 are gone from the dependency tree.

1. Run `npm uninstall metrics-graphics`.
2. Check the tree:
   - `npm ls d3` shows only Plot's `d3@7`.
   - `npm ls d3-scale d3-selection d3-shape` shows ensemble's exact pins deduped against Plot's.
   - `npm ls d3-transition` shows only d3 7's copy.
   - If nothing in `src/` imports `d3-shape` any more, uninstall it. Keep `d3-scale` and `d3-selection`, because `SummaryMetric.jsx` uses them.
3. Run `npm run build` and measure the chart chunk as described under Concrete Steps. Record its size next to Milestone 1's baseline.
4. Update `docs/architecture/frontend.md`'s "dependency ceiling" section, which still says metrics-graphics stays on 2.15.6. It no longer exists. Run `git grep -n -i "metrics-graphics\|metricsgraphics"` over the whole tree. The only allowed hits are older ExecPlans under `docs/execplans/`, which are history and stay as written.

Acceptance:

- `npm test` passes: lint, Vitest, and Playwright in both modes. If the live-data run fails, re-run it once and say whether upstream data caused it.
- `npm run build` succeeds.
- The size comparison is recorded.

## Concrete Steps

Run everything from the repository root, `/Users/shobson/Sites/ensemble`, on Node 24.

Setup and baselines (Milestone 1):

    git switch -c observable-plot-charts react-18-upgrade    # already done; rename once there is an issue
    npm install
    npm run build:css
    npm run test:jest                 # record "N files, M tests passing"
    npm run test:playwright:recorded
    npm run build
    ls build/assets/                  # find the chunk holding ChartContainer and the chart library
    npx source-map-explorer build/assets/<chart-chunk>.js --no-border-checks

`npm run size` analyzes only `index-*.js`, and the chart code is in a lazily loaded chunk, so name that chunk explicitly. Record its file name, raw size, and gzipped size (`gzip -c build/assets/<chart-chunk>.js | wc -c`).

Resize baseline. Run `npm run build && npx vite preview --port 4173 --strictPort`. The preview uses live data from data.firefox.com. Then run a short Playwright script, kept outside the repository, for Chromium and then Firefox:

1. Open `http://localhost:4173/dashboard/hardware` at 1400×900.
2. Wait for `#plugins-metric-overview-1 svg`, then 1.5 seconds more.
3. Set the viewport width to 1200, 1000, 800, 1000, and 1400 in turn, keeping 900 high.
4. After each step, wait for two animation frames, then record the milliseconds the step took.

Record each step's time and the total for both browsers. Run it against the base build and this branch's build on the same machine, with nothing else heavy running.

Spike:

    npm install --save-exact @observablehq/plot@0.6.18
    npx vitest run src/tests/jest/PlotSpike.test.jsx
    npm start                         # hover http://localhost:3000/dashboard/user-activity

Milestones 2 and 3, after each change:

    npm run lint
    npm run test:jest
    npm run test:playwright:recorded
    npx playwright test fixtures/chart-series.spec.js    # one spec, while iterating

Milestone 3 only:

    npm uninstall metrics-graphics
    npm ls d3 d3-transition d3-scale d3-selection d3-shape
    npm run build
    npm test

Fill in real output here as each milestone runs.

## Validation and Acceptance

Automated:

- `npm run lint` is clean.
- `npm run test:jest` passes. `Chart.test.jsx` has at least as many cases as before, and each old case's intent is still covered.
- `npm run test:playwright:recorded` passes. CI requires this suite.
- `npm run test:playwright:live` passes, or fails only on upstream data changes, confirmed by one re-run.
- `npm run build` succeeds.

By hand, with `npm start`:

1. Open `http://localhost:3000/dashboard/user-activity`. Each chart shows its lines, y-axis bounds, and legend as on the base branch. Hovering anywhere in a chart shows "Month D, YYYY: value" at the top for the point nearest the cursor, with a dot on that point. Moving off the chart clears it.
2. On the same page, change the region to Germany. The lines, legend, and readout switch to Germany's data, with no console errors.
3. Open `http://localhost:3000/dashboard/hardware`. Charts with more than 11 populations show distinct colors, and each legend entry's color matches its line.
4. On a chart with annotations, for example a Firefox release marker, dashed grey rules with labels appear only inside the chart's date range. Labels don't overlap each other or the readout.
5. A metric with a `%` unit shows `%` on its y ticks. A metric with another unit shows that unit as a y-axis label.
6. Resize the window. The charts redraw at the new width, and the legend wraps as it did before.

## Idempotence and Recovery

Every step is a file edit or an npm command, and is safe to repeat. If a lockfile change goes wrong, `git checkout package.json package-lock.json && npm install` restores the previous tree. Milestone 2 leaves metrics-graphics installed, so reverting Milestone 2's commits fully restores the old charts. The Milestone 1 spike files are never committed.

## Artifacts and Notes

Baselines on the base branch (`react-18-upgrade` plus this plan), 2026-11-05:

    npm run test:jest                   15 files, 84 tests passing
    npm run test:playwright:recorded    70 passed
    npm run build, lazy chart chunk:
      build/assets/ChartContainer-BDrT8WnZ.js   492.38 kB │ gzip: 154.29 kB

Milestone 1 spike, in-browser hover on `/dashboard/hardware`'s first chart (36 lines), identical in Chromium and Firefox:

    0.5,0.3 of frame:   August 15, 2022: 12.397%
    0.5,0.9 of frame:   October 3, 2022: 1.016%
    top-left corner:    January 7, 2019: 9.513%
    bottom-right:       October 12, 2026: 1.121%
    mouse off chart:    readout cleared
    click, then move:   readout stays pinned
    console errors:     none

Resize on the hardware dashboard, five steps (1200, 1000, 800, 1000, 1400 wide), milliseconds per step:

    base       chromium   11355  12158   9854   9878  12130   total 55375
    base       firefox    15755  14803  10722  10754  14727   total 66761
    Plot       chromium     141    101     99     96    122   total   559
    Plot       firefox      173    150    133    133    131   total   720

Lazy chart chunk after Milestone 2, with metrics-graphics still installed but no longer imported:

    build/assets/ChartContainer-BfSAjc2W.js   302.33 kB │ gzip: 101.34 kB   (was 492.38 kB │ 154.29 kB)

After Milestone 2:

    npm run test:jest                   15 files, 92 tests passing
    npm run test:playwright:recorded    78 passed
    npm run lint                        clean

After Milestone 3:

    npm ls d3                           d3@7.9.2 under @observablehq/plot only
    npm test                            lint clean; Vitest 15 files, 92 tests; Playwright 124 passed (recorded and live)

After fixing the hover shift (2026-11-06):

    npm run test:playwright:recorded    80 passed
    build/assets/ChartContainer-Btl1BEIQ.js   265.06 kB │ gzip: 89.54 kB

## Interfaces and Dependencies

New dependency: `@observablehq/plot` `0.6.18`, exact-pinned, as `AGENTS.md` requires. It depends on `d3` `^7.9.2`, `isoformat`, and `interval-tree-1d`. It ships as ES modules, so Vite tree-shakes it, and it lands in the lazily loaded chart chunk because only `ChartContainer`'s subtree imports it.

Removed: `metrics-graphics` `2.15.6`, and with it `d3@4.13.0`. Possibly `d3-shape`, if nothing else imports it.

At the end of Milestone 2, these exist:

- `src/components/views/ObservablePlot.jsx`: `export default class extends React.Component`. It takes one prop, `options`, a Plot options object, and renders `<div className="observable-plot">` holding the SVG that `Plot.plot(options)` returns.
- `src/components/views/Chart.jsx`: the same props as today, minus `legendTarget`: `data`, `legend`, `showLegend`, `markers`, `width`, `height`, `numPopulations`, `yUnit`, `suggestedYMin`, and `suggestedYMax`. It renders the chart and legend, or the empty message.
- Stable class names that tests rely on:
  - `chart-svg` is on the `<svg>`.
  - `chart-line`, `chart-point`, `chart-marker`, `chart-marker-label`, `chart-hover-point`, and `chart-readout` are each on a mark's `<g>`.
  - `legend-entry` is on each legend `<span>`.
  - `chart-empty` is on the no-data message.

How the pointer readout works, so the next reader need not look it up. `Plot.pointer(options)` wraps a mark's options. On each pointer move, Plot finds the datum whose position is nearest the cursor, within `maxRadius` pixels (40 by default), and redraws that mark with only that datum. The position comes from `px` and `py` if given, otherwise from `x` and `y`. Giving the readout text mark `px` and `py` for the search, plus `frameAnchor: 'top'` for its position, puts the readout at the top of the frame whichever point is hovered. Clicking pins the current datum until the next click. Pointer marks that share the same data and the same `maxRadius` pick the same datum.

## Revision notes

2026-11-05: revised after an independent review of the first draft. It now sets the x domain from the data and filters out-of-range markers. It reserves rows so marker labels and the readout don't collide, and matches the existing marker styling. It uses one shared hover radius and accepts click-to-pin. It lists every metrics-graphics selector, including the bare `path.mg-line1`, and identifies lines by color because empty populations draw no path. It corrects the legend's position to below the chart. It strengthens the tests: real scale domains, 12 real populations, empty-population and recovery cases, and nearest-point hover. It adds a repeatable resize measurement with a regression rule, and measures the lazy chart chunk instead of `index-*.js`. It moves every docs, comment, and style update into Milestone 2, where they go stale. It requires the issue number and a committed plan before execution.

2026-11-05: revised after an adversarial review. Each population is now sorted by date before drawing, because metrics-graphics did that itself and 22 recorded populations arrive out of order. Marker labels now use one `Plot.text` mark per row, because Plot's `dy` cannot vary per label. Both cases are added to the spike, to Vitest, and to Playwright.
