import React from 'react';


export default props => {
    let maybeMessage = null;

    if (props.message) {
        maybeMessage = <p>{props.message}</p>;
    }

    return (
        <section id={props.id} className="error" data-http-status={props.httpStatus}>
            <h2>{props.title}</h2>
            {maybeMessage}
        </section>
    );
};
