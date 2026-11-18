import indexHtmlPlugin, { shellHtml } from '../../../scripts/indexHtmlPlugin.mjs';


it('The page shell links to each dashboard, in order, then Contact', () => {
    const shell = shellHtml([
        { key: 'one', menuTitle: 'One' },
        { key: 'two', menuTitle: 'Two & Three' },
    ]);

    expect(shell).toContain(
        '<ul><li><a href="/dashboard/one">One</a></li><li><a href="/dashboard/two">Two &#38; Three</a></li>' +
        '<li><a href="/contact">Contact</a></li></ul>'
    );
    expect(shell).not.toContain('id="application"');
});

it('Puts the page shell inside #root, and refuses an index.html without an empty #root', () => {
    const { transformIndexHtml } = indexHtmlPlugin();

    expect(transformIndexHtml('<body><div id="root"></div></body>'))
        .toMatch(/^<body><div id="root"><div class="app-shell"><header id="main-header">.*<\/main><\/div><\/div><\/body>$/);
    expect(() => transformIndexHtml('<body><div id="app"></div></body>')).toThrow('<div id="root"></div>');
});
