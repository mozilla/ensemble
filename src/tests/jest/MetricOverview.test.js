import MetricOverview from '../../components/views/MetricOverview';


it('Markdown links (and only Markdown links) are parsed in single-paragraph descriptions', () => {
    const mo1 = shallow(
        <MetricOverview
            description='This is a test of the Markdown parser.'
        />
    );

    const mo2 = shallow(
        <MetricOverview
            description='This is a [test](http://example.com) of the Markdown parser.'
        />
    );

    const mo3 = shallow(
        <MetricOverview
            description='This is a <script>alert(1)</script> [test](http://example.com) of **the** Markdown <strong>parser</strong>.'
        />
    );

    // We only need to use .html() because the description is set using
    // dangerouslySetInnerHTML.
    expect(mo1.find('.metric-description').html()).toContain('This is a test of the Markdown parser.');
    expect(mo2.find('.metric-description').html()).toContain('This is a <a href="http://example.com">test</a> of the Markdown parser.');
    expect(mo3.find('.metric-description').html()).toContain('This is a &lt;script&gt;alert(1)&lt;/script&gt; <a href="http://example.com">test</a> of **the** Markdown &lt;strong&gt;parser&lt;/strong&gt;.');
});

it('Markdown links (and only Markdown links) are parsed in multi-paragraph descriptions', () => {
    const mo1 = shallow(
        <MetricOverview
            description={[
                'Line 1',
                'This is a test of the Markdown parser.',
                'Line 3',
            ]}
        />
    );

    const mo2 = shallow(
        <MetricOverview
            description={[
                'Line 1',
                'This is a [test](http://example.com) of the Markdown parser.',
                'Line 3',
            ]}
        />
    );

    const mo3 = shallow(
        <MetricOverview
            description={[
                'Line 1',
                'This is a <script>alert(1)</script> [test](http://example.com) of **the** Markdown <strong>parser</strong>.',
                'Line 3',
            ]}
        />
    );

    // We only need to use .html() because the description is set using
    // dangerouslySetInnerHTML.
    expect(mo1.find('.metric-description').html()).toContain('This is a test of the Markdown parser.');
    expect(mo2.find('.metric-description').html()).toContain('This is a <a href="http://example.com">test</a> of the Markdown parser.');
    expect(mo3.find('.metric-description').html()).toContain('This is a &lt;script&gt;alert(1)&lt;/script&gt; <a href="http://example.com">test</a> of **the** Markdown &lt;strong&gt;parser&lt;/strong&gt;.');
});
