import { Link } from 'react-router';

import './css/NextButton.css';


export default props => (
    <div className="next-button">
        <Link to={props.to}>
            {props.text}
            <span className="next-button-icon" aria-hidden="true" />
        </Link>
    </div>
);
