import indexHtmlPlugin, { preloadTags, shellHtml } from '../../../scripts/indexHtmlPlugin.mjs';


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
    const transformIndexHtml = html => indexHtmlPlugin().transformIndexHtml.handler(html, {}).html;

    expect(transformIndexHtml('<body><div id="root"></div></body>'))
        .toMatch(/^<body><div id="root"><div class="app-shell"><header id="main-header">.*<\/main><\/div><\/div><\/body>$/);
    expect(() => transformIndexHtml('<body><div id="app"></div></body>')).toThrow('<div id="root"></div>');
});

const chunk = (fileName, { imports = [], dynamicImports = [], css = [], isEntry = false } = {}) => ({
    type: 'chunk', fileName, isEntry, imports, dynamicImports, viteMetadata: { importedCss: new Set(css) },
});

const bundle = Object.fromEntries([
    chunk('assets/index.js', { isEntry: true, css: ['assets/index.css'], dynamicImports: ['assets/Home.js', 'assets/Dashboard.js'] }),
    chunk('assets/Home.js', { imports: ['assets/index.js', 'assets/Header.js'], css: ['assets/Home.css'] }),
    chunk('assets/Dashboard.js', { imports: ['assets/index.js', 'assets/Header.js'], dynamicImports: ['assets/Chart.js'] }),
    chunk('assets/Header.js', { imports: ['assets/index.js'], css: ['assets/Header.css'] }),
    chunk('assets/Chart.js', { imports: ['assets/Dashboard.js'], css: ['assets/Chart.css'] }),
    { type: 'asset', fileName: 'assets/Home.css' },
].map(file => [file.fileName, file]));

it('Preloads the routes\' chunks, what they import, and their styles, but not the entry or the chart code', () => {
    expect(preloadTags(bundle).map(({ attrs }) => attrs)).toEqual([
        { rel: 'modulepreload', href: '/assets/Home.js', crossorigin: true },
        { rel: 'modulepreload', href: '/assets/Header.js', crossorigin: true },
        { rel: 'modulepreload', href: '/assets/Dashboard.js', crossorigin: true },
        { rel: 'preload', as: 'style', href: '/assets/Home.css', crossorigin: true },
        { rel: 'preload', as: 'style', href: '/assets/Header.css', crossorigin: true },
    ]);
});

it('Adds the preloads only to a build, where there is a bundle', () => {
    const { handler } = indexHtmlPlugin().transformIndexHtml;
    const html = '<div id="root"></div>';

    expect(handler(html, {}).tags).toEqual([]);
    expect(handler(html, { bundle }).tags).toHaveLength(5);
});
