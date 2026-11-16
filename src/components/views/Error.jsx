export default props => {
    let maybeMessage = null;

    if (props.message) {
        maybeMessage = <p>{props.message}</p>;
    }

    // Only an error that stands in for the whole page takes focus after a
    // navigation, as a page's heading does.
    const pageHeadingProps = props.pageHeading ? { tabIndex: -1, 'data-page-heading': true } : {};

    return (
        <section id={props.id} className="error">
            <h2 {...pageHeadingProps}>{props.title}</h2>
            {maybeMessage}
        </section>
    );
};
