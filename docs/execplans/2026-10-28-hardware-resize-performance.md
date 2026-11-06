# Stop the hardware dashboard hanging on resize and zoom

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`,
`Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds. It is
maintained in accordance with `.claude/skills/execplans/references/PLANS.md`, including its
"Ensemble addendum", which overrides the upstream text where the two disagree.

## Purpose / Big Picture

On <https://data.firefox.com/dashboard/hardware>, resizing the window or zooming freezes the page
for more than 10 seconds and can trigger Firefox's "this page is slowing down" dialog. This is
issue #409 (<https://github.com/mozilla/ensemble/issues/409>), the worst bug visitors see on the
site.

After this work, a visitor can resize or zoom the hardware dashboard and the charts redraw to the
new width in well under a second, with no slow-script dialog. Nothing else changes: when a visitor
switches region, the lines still animate from the old values to the new ones, as they do today.

To see it working, run `npm start`, open <http://localhost:3000/dashboard/hardware> in Firefox,
drag the window narrower and wider, and press Cmd + and Cmd − a few times. The charts settle
almost at once and fit the new width.

Out of scope: replacing metrics-graphics; resizing the summary bars at the top of the dashboard;
React 19.

## Progress

- [x] (2026-10-28) Drafted the plan on branch `409--hardware-resize-performance`, cut from
      `react-18-upgrade` (#465).
- [x] (2026-10-28) Milestone 1: measured the baseline. Median long-task time for the resize
      sequence: 1342 ms on recorded data, 61076 ms on live data (see Surprises).
- [x] (2026-10-28) Milestone 2: metrics-graphics skips the line animation when only the size
      changed. Vitest 16 files, 87 tests. Median long-task time: 54 ms recorded, 2173 ms live. The
      size-only test fails with the change reverted.
- [x] (2026-10-28) Milestone 3: `ChartContainer` redraws once, 150 ms after the last resize event,
      and not at all when its size didn't change. Vitest 16 files, 89 tests; each new test fails
      with its half of the change reverted. Median long-task time: 0 ms recorded, 261 ms live.
      Underscore-convention notes in `AGENTS.md` and `CONTRIBUTING.md` updated for the rename.
- [x] (2026-10-28) Milestone 4: `tests/playwright/specs/fixtures/resize.spec.js` with a 1000 ms
      budget. Recorded Playwright 71 passed, live Playwright 46 passed, lint clean. `AGENTS.md`'s
      headline-bug bullet replaced with a Footguns row; `CONTRIBUTING.md`'s live-flake note no longer
      blames #409. Measurement script deleted.

## Surprises & Discoveries

- Observation: the hang is far worse on live data than the issue reports. In headless Chromium
  against a production build (`vite preview`), stepping the hardware dashboard's viewport 1280,
  1180, 1080, 980, 880, 800, 880, 960, 50 ms apart, blocked the main thread for about 61 seconds on
  live data and about 1.3 seconds on recorded data. The recording keeps only 12 dates, and the
  animation's cost grows with line length.
  Evidence: medians of three runs of the throwaway measurement script, long-task total in ms.

      before the fix     recorded 1342   live 61076
      after Milestone 2  recorded   54   live  2173
      after Milestone 3  recorded    0   live   261 (charts at the new width 480 ms after the last resize)

- Observation: a resize sequence that ends at its starting width measures nothing once
  `ChartContainer` skips redraws when the size is unchanged. The first measurement went 1280 to 800
  and back to 1280, and showed 0 ms after Milestone 3 because no chart redrew at all. The sequence
  now ends at 960, and all three rows above were re-measured with it.
  Evidence: after Milestone 3, the round trip gave 0 ms on live data; ending at 960 gave 261 ms.
- Observation: chart wrapper ids restart in every dashboard section, so the hardware dashboard has
  several `#graphics-metric-overview-1` elements. To reach all 11 charts, select
  `.metricsGraphicsCon > svg`, the element `views/MetricsGraphics.jsx` renders around each chart.
  Evidence: `src/components/views/MetricOverviewCollection.jsx` numbers metrics from 1 within each
  section.
- Observation: on recorded data, a Playwright spec can't tell whether the line animation is back.
  With the debounce in place, each chart redraws once, and one animated redraw of a 12-point line
  takes less than the 50 ms that counts as a long task. The spec serves every hardware metric with
  260 weekly points instead. Then the dev server shows about 150 ms for the fixed code, about 5980 ms
  with the animation back, and about 1565 ms without the debounce.
  Evidence: `resize.spec.js` with a near-zero budget, two runs per variant, reading "Received".
- Observation: the summary bars read the same per-metric files as the line charts. Several slugs,
  such as `gpuVendor`, are both. They look up values by the dashboard's dates, so generated data
  must include those dates or the bars throw "Cannot read properties of undefined (reading 'y')".
  Evidence: `SummaryMetricContainer.formatData` finds the point where `dp.x === activeDate`.

## Decision Log

- Decision: fix the hang inside the current metrics-graphics setup, rather than replace the chart
  library first.
  Rationale: the user's choice. The fix is small, and it doesn't stop a library replacement later.
  Date/Author: 2026-10-28, Stephanie Hobson.
- Decision: stack the branch on `react-18-upgrade` rather than cut it from `main`.
  Rationale: `src/components/views/MetricsGraphics.jsx`, the file this fix changes, only exists
  on that branch. On `main` the chart comes from the old react-metrics-graphics package, so a fix
  cut from `main` would conflict with #465.
  Date/Author: 2026-10-28, Stephanie Hobson.
- Decision: keep the line animation when the data changes, and turn it off only when the size
  changed.
  Rationale: region switches update the charts in place and animate the lines. Visitors see that,
  and the issue is about resizing, not region changes. Turning the animation off everywhere would
  be a visible change nobody asked for.
  Date/Author: 2026-10-28, Stephanie Hobson.
- Decision: debounce each chart's own resize listener, rather than share one listener across all
  charts.
  Rationale: the issue's comments blame the 11 listeners, but the cost is the redraws they trigger,
  not the listeners. A shared, debounced listener would still redraw all 11 charts at the same
  moment, and it would add module-level state to a component that has none.
  Date/Author: 2026-10-28, Stephanie Hobson.
- Decision: the resize spec lives in `tests/playwright/specs/fixtures/`, runs on recorded data
  only, and serves generated 260-week data for every hardware metric. Its budget is 1000 ms of
  long tasks.
  Rationale: specs that replace data responses live in `fixtures/`, which the live-data project
  skips. Live data is too variable for a timing budget anyway. Long lines are needed to catch the
  animation coming back (see Surprises). 1000 ms leaves the fixed code about six times headroom
  for a slow CI runner, and still fails if either half of the fix is reverted.
  Date/Author: 2026-10-28, Stephanie Hobson.

## Outcomes & Retrospective

Resizing the hardware dashboard no longer hangs. On live data, the resize sequence went from about
61 seconds of blocked main thread to about a quarter of a second. The charts reach the new width
about half a second after the last resize. Region changes still animate. Two Vitest tests and one
Playwright spec fail if either half of the fix is reverted.

Not checked here: the Firefox profile, and the by-hand checks in Validation and Acceptance, which
need a person at a real browser. The summary bars still don't resize, as before.

Lessons. Most of the cost was one library default, `transition_on_update`, and not the number of
listeners the issue pointed at. Measure before choosing the fix. And check that a benchmark makes
the code do work: a resize that ends where it started measured a no-op as a 100% improvement.

## Context and Orientation

This site is a React 18 single-page app built with Vite. It fetches all its data at runtime from
`https://data.firefox.com/datasets/...` and draws it in the browser. `AGENTS.md` at the
repository root describes the layout. This plan builds on
`docs/execplans/2026-10-26-react-18-upgrade.md`, which added the local
`src/components/views/MetricsGraphics.jsx`. Nothing else from that plan matters here.

The repository splits components into containers, which hold state and fetch data
(`src/components/containers/`), and views, which render what they are given
(`src/components/views/`). A line chart is drawn by three layers:

1. `src/components/containers/ChartContainer.jsx` works out the chart's width and height from the
   width of the page's `#application > main` element, and keeps them in `this.state`. In
   `componentDidMount` it adds a `window` `resize` listener, `setChartSize`, which measures again
   and calls `setState` every time. It doesn't check whether the size changed.
2. `src/components/views/Chart.jsx` turns the props into metrics-graphics options (axis bounds,
   units, legend, colours) and renders `MetricsGraphics`.
3. `src/components/views/MetricsGraphics.jsx` is a class component of about 20 lines. It calls
   `MG.data_graphic({ ...this.props, target })` in both `componentDidMount` and
   `componentDidUpdate`, so every re-render redraws the whole chart.

metrics-graphics (the `metrics-graphics` package, version 2.15.6, unmaintained) is the charting
library. `MG.data_graphic(options)` draws a chart into `options.target`. If the target already holds
a chart, it updates the existing lines instead of drawing new ones. Its `transition_on_update`
option defaults to `true`. When it is on, metrics-graphics animates each existing line from its old
shape to its new shape over one second, using a function called `path_tween` (in
`node_modules/metrics-graphics/dist/metricsgraphics.js`, around line 7585, and called around line
4424). Before the animation starts, `path_tween` samples both the old and the new line every 4
pixels along their length with the browser's `SVGPathElement.getPointAtLength`. Each of those calls
takes time proportional to the length of the line, so the total cost grows with the square of the
line length. With `transition_on_update: false`, metrics-graphics just sets the line's new shape and
never calls `path_tween`.

The hardware dashboard (`/dashboard/hardware`) has 11 line charts, with between 1 and 18 lines each
(GPU model has 18). Here is what happens on a resize today. The browser fires dozens of `resize`
events during a single drag. Each event makes all 11 `ChartContainer`s call `setState`, each one
re-renders `MetricsGraphics`, and each redraw starts a `path_tween` animation for every line, which
cancels the previous one. Issue #409's Firefox and Chrome profiles show about 10 seconds spent in
`getPointAtLength`. A commenter on the issue measured about 3.5 seconds with only one listener
left. That is better, but it still animates every line.

Region changes take a different path that this plan must not break. When the visitor picks a
region, `src/components/containers/MetricOverviewContainer.jsx` fetches the new data but keeps the
old chart on screen (its `shouldComponentUpdate` skips the pending state). When the new data
arrives, `ChartContainer` re-renders with new `data` and the same size, and metrics-graphics
animates the lines to their new values. That animation is the one to keep.

The summary bars at the top of the hardware dashboard (`src/components/views/SummaryMetric.jsx`)
are drawn with d3 directly. They have a `_handleResize` method that nothing calls, so they never
redraw on resize. They aren't part of this hang, and this plan leaves them alone.

Tests. Vitest unit tests live in `src/tests/jest/`. `src/tests/jest/ChartContainer.test.jsx`
replaces `views/Chart` with `vi.fn(() => null)` and checks the props it was last called with. Its
`renderChart` helper wraps the container in `<div id="application"><main>`, because
`ChartContainer` measures that element, and it fakes widths with
`vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get')`. `src/setupTests.js` fails any test that
logs a `console.error`. Playwright specs live in `tests/playwright/specs/` and import `test` and
`expect` from `tests/playwright/fixtureData.js`. In the `chromium` project that `test` answers
every data request from the recording in `tests/playwright/fixtures/` (trimmed to 12 dates), and in
the `live-data` project it lets requests reach the real site. Chart wrapper ids
(`graphics-metric-overview-N`) restart at 1 in each dashboard section, so a spec that wants every
chart on the hardware dashboard selects `.metricsGraphicsCon > svg`, which `MetricsGraphics.jsx`
renders once per chart.

## Plan of Work

### Milestone 1: measure the baseline

Before changing anything, measure the hang so the fix can show what it changed. Write a throwaway
script, `scripts/measureResize.js`, that is not committed. It uses `@playwright/test`'s `chromium`
to open `/dashboard/hardware` against a running server and waits until there are 11
`.metricsGraphicsCon > svg` elements. It then installs a `PerformanceObserver` for `longtask` entries, steps the viewport width
from 1280 through 1180, 1080, 980, 880, 800, 880, and 960, 50 ms apart, and waits until every chart
`svg` has the width of `#application > main` and no long task has run for 1.5 seconds. It prints the total
duration of long tasks and the time from the first resize until the charts settled.

Run it three times against a production build with recorded data, and three times with live data.
Serve recorded data by routing `https://data.firefox.com/datasets/desktop/**` to
`tests/playwright/fixtures/` the way `fixtureData.js` does. Record the medians in Surprises &
Discoveries. Nothing is committed in this milestone except the plan update. No documentation goes
stale.

### Milestone 2: no line animation on a size-only redraw

In `src/components/views/MetricsGraphics.jsx`, change `componentDidUpdate` to take `prevProps`. If
`prevProps.data === this.props.data`, the redraw happened for some other reason (in practice, a new
width or height), so draw with `transition_on_update: false`. Otherwise draw as today, so the
metrics-graphics default of `true` animates the region change. `_draw` takes an optional object of
extra options that it spreads after the props. Comparing `data` by reference is safe because
`ChartContainer` memoizes its formatted data with `memoize-one`, so the array only changes when the
fetched data does. Update the file's opening comment, which says the chart "is redrawn on every
update". It stays true, but add that size-only redraws aren't animated, and why: animating many
lines is what made resizing hang.

Add `src/tests/jest/MetricsGraphics.test.jsx`. It mocks `metrics-graphics` with
`vi.mock('metrics-graphics', () => ({ default: { data_graphic: vi.fn() } }))`. It renders
`MetricsGraphics` with some `data`, then re-renders with the same `data` array and a new `width`,
and checks that the last `data_graphic` call had `transition_on_update: false` and the new width.
It then re-renders with a new `data` array and checks that the last call had no
`transition_on_update` key. A third test checks that the chart is drawn into the component's own `.metricsGraphicsCon`
element. Run `npm run test:jest` and expect 16 files and 87 tests to pass.
Re-run the Milestone 1 script and record the numbers.

### Milestone 3: one redraw per resize, and none when the size didn't change

In `src/components/containers/ChartContainer.jsx`:

1. Rename `setChartSize` to `_setChartSize`, the repository's convention for private handlers.
2. Make `_setChartSize` return without calling `setState` when the measured width and height equal
   `this.state.chartWidth` and `this.state.chartHeight`.
3. Add `_onResize`, which clears `this.resizeTimeout` and sets it to
   `setTimeout(this._setChartSize, 150)`. Register `_onResize` as the `resize` listener instead of
   `_setChartSize`. `componentDidMount` still calls `_setChartSize` directly, so the first render
   isn't delayed.
4. In `componentWillUnmount`, remove the `_onResize` listener and `clearTimeout(this.resizeTimeout)`,
   so a timer that fires after unmount doesn't call `setState` on an unmounted component.

The existing comment "Set the chart size state based on the real, rendered parent container" still
holds. Add one short comment on `_onResize` saying why it waits: every redraw is expensive, and a
drag fires dozens of resize events. Check `docs/architecture/frontend.md` for any description of the
resize behaviour and update it if there is one.

Extend `src/tests/jest/ChartContainer.test.jsx` with two tests that use `vi.useFakeTimers()` and
`vi.useRealTimers()` in a `try`/`finally`. The first renders at a width of 900, changes the faked
`offsetWidth` to 700, dispatches five `resize` events on `window`, and checks that `Chart` hasn't
been called again. After `vi.advanceTimersByTime(150)` inside `act`, `Chart` has been called once
more, with `width: 700`. The second dispatches a `resize` without changing the width, advances the
timers, and checks that `Chart` wasn't called again. Run `npm run test:jest` and expect 16 files
and 89 tests to pass. Re-run the Milestone 1 script and record the numbers.

### Milestone 4: guard it in Playwright and record the result

Add `tests/playwright/specs/fixtures/resize.spec.js` (CommonJS, importing `test`, `expect`, and
`readFixture` from `../../fixtureData`). It lives in `fixtures/` because it replaces data
responses, so only the recorded-data `chromium` project runs it. In `beforeEach` it routes every
`/hardware/default/<slug>/index.json` request to the recorded metric with its populations replaced
by 260 weekly points. The points count back from the hardware dashboard's newest date, because the
summary bars read the same files and look values up by those dates. The test opens
`/dashboard/hardware` at a 1280 px wide viewport, waits for 11 `.metricsGraphicsCon > svg`
elements, and installs a `longtask` observer. It steps the viewport through 1180, 1080, 980, 880,
800, 880, and 960, then polls until every chart `svg` has the `offsetWidth` of `#application >
main`. After one more second, it expects the long-task total to be under 1000 ms.

Check the budget from both sides: with a near-zero budget, read the "Received" value for the fixed
code, then for the code with Milestone 2 reverted, then with Milestone 3 reverted. The fixed code
should sit well under 1000 ms, and both reverted versions well over it.

Re-run the measurement for all three versions with the same resize sequence, and write the medians
into Surprises & Discoveries and Outcomes & Retrospective. Delete `scripts/measureResize.js`. In
`AGENTS.md`, remove the "Headline known bug" bullet about #409 and add a Footguns row saying why
size-only redraws must not animate. In `CONTRIBUTING.md`, the note on the live "Charts render"
retry blamed #409, but that test is about the first load, which this work doesn't change. Keep the
note and drop the #409 reference.

## Concrete Steps

All commands run from the repository root.

    npm install
    npm run build:css
    npx playwright install chromium

Baseline and after each milestone (Milestone 1's script, deleted in Milestone 4; recreate it from
Milestone 1's description if you need it again):

    npm run build:app
    npx vite preview --port 3001 --strictPort &
    node scripts/measureResize.js http://localhost:3001 --recorded
    node scripts/measureResize.js http://localhost:3001 --live

Tests after each milestone:

    npm run lint
    npm run test:jest
    npm run test:playwright:recorded
    npm run test:playwright:live

Expected after Milestone 3: `npm run test:jest` reports 16 files and 89 tests passed. The recorded
Playwright run reports every spec passing. After Milestone 4 that is 71 specs, including
`fixtures/resize.spec.js`.

## Validation and Acceptance

1. Run `npm start` and open <http://localhost:3000/dashboard/hardware> in Firefox. Drag the window
   from wide to narrow and back. The charts redraw to the new width within about a second of letting
   go, and Firefox shows no slow-script dialog.
2. On the same page, press Cmd + three times and Cmd − three times. The charts follow each step.
3. Open <http://localhost:3000/dashboard/user-activity> and change the region to Germany. The lines
   animate from the old values to the new ones over about a second, as before.
4. `MetricsGraphics.test.jsx`'s size-only test fails if Milestone 2's change is reverted.
   `ChartContainer.test.jsx`'s five-events test fails if Milestone 3's debounce is reverted.
5. `npm run test:playwright:recorded` passes, including `fixtures/resize.spec.js`. Reverting either
   Milestone 2 or Milestone 3 makes that spec fail on its long-task budget.
6. Optional: record a Firefox profile (<https://profiler.firefox.com/>) while resizing. It shows no
   `getPointAtLength` time.

## Idempotence and Recovery

Every step can be repeated. Milestones 2 and 3 are each one small file change plus a test, and
each can be reverted on its own. The measurement script writes nothing to disk. If `vite preview`
is still running from an earlier attempt, stop it, or pick another port with `--port`.

## Artifacts and Notes

The line-update code in metrics-graphics that this plan avoids on resize
(`node_modules/metrics-graphics/dist/metricsgraphics.js`, around line 4424):

    if (!plot.display_area && args.transition_on_update && !args.missing_is_hidden) {
        lineTransition.attrTween('d', path_tween(plot.line(args.data[which_line]), 4));
    } else {
        lineTransition.attr('d', plot.line(args.data[which_line]));
    }

## Interfaces and Dependencies

No new dependencies. Debouncing uses `setTimeout`/`clearTimeout`, not a library.

At the end of the work, `src/components/views/MetricsGraphics.jsx` has
`componentDidUpdate(prevProps)` and `_draw(extraOptions = {})`, which calls
`MG.data_graphic({ ...this.props, ...extraOptions, target: this.chartElement.current })`.

`src/components/containers/ChartContainer.jsx` has `_setChartSize()`, which measures and calls
`setState` only when the size changed, and `_onResize()`, which debounces `_setChartSize` by
150 ms through `this.resizeTimeout`. `window`'s `resize` listener is `_onResize`.

Revision note (2026-10-28): the resize spec moved from `tests/playwright/specs/` to
`tests/playwright/specs/fixtures/` and serves generated 260-week data. On the recording's 12-point
lines it couldn't detect the animation coming back. The measurement sequence now ends at 960 px
instead of returning to 1280 px, because a round trip measured a no-op once unchanged sizes were
skipped.
