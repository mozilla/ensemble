import { Link } from 'react-router';

import './css/NextButton.css';


export default props => (
    <div className="next-button">
        <Link to={props.to}>{props.text}</Link>
    </div>
);
