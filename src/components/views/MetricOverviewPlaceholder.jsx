import Spinner from './Spinner';
import StripedHeader from './StripedHeader';

import './css/MetricOverview.css';


// Holds a metric's place while its data loads, at the height of its title and
// chart, so that the metrics below it don't move when it arrives. The title is
// a non-breaking space so that the header keeps its full height.
export default props => (
    <div className="metric-overview metric-overview-placeholder" aria-hidden="true">
        <StripedHeader tag={props.inSection ? 'h5' : 'h4'} label={' '} />
        <div className="metric-and-legend">
            <Spinner />
        </div>
    </div>
);
