import { render } from '@testing-library/react';

import MetricOverview from '../../components/views/MetricOverview';


it('Markdown links (and only Markdown links) are parsed in single-paragraph descriptions', () => {
    const { container: mo1 } = render(
        <MetricOverview
            description='This is a test of the Markdown parser.'
        />
    );

    const { container: mo2 } = render(
        <MetricOverview
            description='This is a [test](http://example.com) of the Markdown parser.'
        />
    );

    const { container: mo3 } = render(
        <MetricOverview
            description='This is a <script>alert(1)</script> [test](http://example.com) of **the** Markdown <strong>parser</strong>.'
        />
    );

    // innerHTML, not text, because the description is set using
    // dangerouslySetInnerHTML and the assertions are about the markup.
    expect(mo1.querySelector('.metric-description').innerHTML).toContain('This is a test of the Markdown parser.');
    expect(mo2.querySelector('.metric-description').innerHTML).toContain('This is a <a href="http://example.com">test</a> of the Markdown parser.');
    expect(mo3.querySelector('.metric-description').innerHTML).toContain('This is a &lt;script&gt;alert(1)&lt;/script&gt; <a href="http://example.com">test</a> of **the** Markdown &lt;strong&gt;parser&lt;/strong&gt;.');
});

it('Markdown links (and only Markdown links) are parsed in multi-paragraph descriptions', () => {
    const { container: mo1 } = render(
        <MetricOverview
            description={[
                'Line 1',
                'This is a test of the Markdown parser.',
                'Line 3',
            ]}
        />
    );

    const { container: mo2 } = render(
        <MetricOverview
            description={[
                'Line 1',
                'This is a [test](http://example.com) of the Markdown parser.',
                'Line 3',
            ]}
        />
    );

    const { container: mo3 } = render(
        <MetricOverview
            description={[
                'Line 1',
                'This is a <script>alert(1)</script> [test](http://example.com) of **the** Markdown <strong>parser</strong>.',
                'Line 3',
            ]}
        />
    );

    // innerHTML, not text, because the description is set using
    // dangerouslySetInnerHTML and the assertions are about the markup.
    expect(mo1.querySelector('.metric-description').innerHTML).toContain('This is a test of the Markdown parser.');
    expect(mo2.querySelector('.metric-description').innerHTML).toContain('This is a <a href="http://example.com">test</a> of the Markdown parser.');
    expect(mo3.querySelector('.metric-description').innerHTML).toContain('This is a &lt;script&gt;alert(1)&lt;/script&gt; <a href="http://example.com">test</a> of **the** Markdown &lt;strong&gt;parser&lt;/strong&gt;.');
});
