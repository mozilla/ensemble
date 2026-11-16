import './css/SummaryMetric.css';


// Holds a summary metric's place while its data loads, at the size of its
// title and bar, so that the others beside it don't move when it arrives. The
// bar is an empty SVG, so that it lines up as the real one does.
export default () => (
    <div className="summary-metric" aria-hidden="true">
        <h4>{' '}</h4>
        <svg className="summary-metric-placeholder-bar" />
    </div>
);
