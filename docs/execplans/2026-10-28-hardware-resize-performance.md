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
- [x] (2026-10-28) Milestone 1: measured the baseline. Median main-thread long-task time for the
      10-step resize: 1826 ms on recorded data, 76597 ms on live data (see Surprises).
- [x] (2026-10-28) Milestone 2: metrics-graphics skips the line animation when only the size
      changed. Vitest 16 files, 87 tests. Median long-task time: 52 ms recorded (was 1826), 3254 ms
      live (was 76597). The size-only test fails with the change reverted.
- [ ] Milestone 3: `ChartContainer` redraws once after a resize ends, and not at all when its size
      didn't change.
- [ ] Milestone 4: Playwright resize spec with a timing budget; before and after numbers recorded.

## Surprises & Discoveries

- Observation: the recorded Playwright data is trimmed to the 12 most recent dates, so its lines
  are much shorter than the live ones. The animation cost grows with line length, so a baseline on
  recorded data will understate the hang. Milestone 1 measures both.
  Evidence: `scripts/recordPlaywrightFixtures.js` trims to 12 dates; live metrics carry years of
  weekly dates.
- Observation: the baseline hang is far worse on live data than the issue reports. In headless
  Chromium against `vite preview`, stepping the hardware dashboard's viewport 1280 to 800 and back
  in 10 resizes, 50 ms apart, blocked the main thread for about 77 seconds on live data and about
  1.8 seconds on recorded data. The two runs differ only in line length.
  Evidence: three runs each of `scripts/measureResize.js`. Recorded: long tasks 1826, 1827, 1818 ms.
  Live: long tasks 76597, 76616, 76554 ms.
- Observation: chart wrapper ids restart in every dashboard section, so the hardware dashboard has
  several `#graphics-metric-overview-1` elements, one per section. To reach all 11 charts, select
  `.metricsGraphicsCon > svg`, the element `views/MetricsGraphics.jsx` renders around each chart.
  Evidence: `src/components/views/MetricOverviewCollection.jsx` numbers metrics from 1 within each
  section, and prefixes the section key when there is one.
- Observation: the line animation was almost all of the cost. Turning it off for size-only redraws
  cut the resize run from 1826 ms to 52 ms of long tasks on recorded data, and from 76597 ms to
  3254 ms on live data. What remains on live data is 11 full redraws per resize event.
  Evidence: three runs each of `scripts/measureResize.js` after Milestone 2. Recorded: 60, 52, 51
  ms. Live: 3254, 3254, 3213 ms.

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

## Outcomes & Retrospective

Not started.

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
1280, 1180, ... 800 and back up to 1280 (about 10 resizes, 50 ms apart), and waits until every chart
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

Add `tests/playwright/specs/resize.spec.js` (CommonJS, importing from `../fixtureData`). It runs in
both the `chromium` and `live-data` projects, like the other specs. One test opens
`/dashboard/hardware` at a 1280 px wide viewport and waits for all 11 chart `svg`s. It installs the
`longtask` observer from Milestone 1, resizes through the same steps down to 800 px, and expects
every `.metricsGraphicsCon > svg` to reach the width that matches the new layout. Read that
width from `#application > main`'s `offsetWidth` in the page, rather than hardcoding it. Then it
expects the total long-task time to stay under a budget set between the before and after numbers
on recorded data. Milestone 1 measured 1826 ms before the fix on recorded data, so the budget has to
be below that. Pick it once Milestone 3's numbers are in, leaving room for a slow CI runner, and
record the choice in the Decision Log.

Run the measurement once more on the final code. Write the before and after medians into Outcomes &
Retrospective, ready for the pull request. Delete `scripts/measureResize.js`. Update `AGENTS.md`:
its "Headline known bug" bullet describes #409 as open. Change it to name what was fixed, or remove
it if the issue is closed when this merges.

## Concrete Steps

All commands run from the repository root.

    npm install
    npm run build:css
    npx playwright install chromium

Baseline and after each milestone (Milestone 1's script, not committed):

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
Playwright run reports every spec passing, and after Milestone 4 that includes `resize.spec.js`.

## Validation and Acceptance

1. Run `npm start` and open <http://localhost:3000/dashboard/hardware> in Firefox. Drag the window
   from wide to narrow and back. The charts redraw to the new width within about a second of letting
   go, and Firefox shows no slow-script dialog.
2. On the same page, press Cmd + three times and Cmd − three times. The charts follow each step.
3. Change the region to Germany. The lines animate from the old values to the new ones over about a
   second, as before.
4. `MetricsGraphics.test.jsx`'s size-only test fails if Milestone 2's change is reverted.
   `ChartContainer.test.jsx`'s five-events test fails if Milestone 3's debounce is reverted.
5. `resize.spec.js` passes in the recorded `chromium` project and in `live-data`.
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
