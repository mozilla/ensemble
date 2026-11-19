import config from '../src/config.json' with { type: 'json' };

// lazyLoad starts the route chunks as soon as the main script runs, so
// listing them in the HTML costs no extra bytes: it only lets them download
// alongside the main script instead of after it. Only the routes, and what
// they import: the chart code, which the dashboard imports lazily, would take
// bandwidth from the main script before anything needs it.
//
// Every tag is crossorigin because Vite loads the chunks and their
// stylesheets that way, and a preload whose mode doesn't match is fetched a
// second time.
export function preloadTags(bundle) {
    const files = Object.values(bundle);
    const entry = files.find(file => file.type === 'chunk' && file.isEntry);
    const chunks = new Set();
    const add = fileName => {
        if (fileName === entry.fileName || chunks.has(fileName)) return;
        chunks.add(fileName);
        bundle[fileName].imports.forEach(add);
    };
    entry.dynamicImports.forEach(add);

    const link = attrs => ({ tag: 'link', attrs: { ...attrs, crossorigin: true }, injectTo: 'head' });
    return [
        ...[...chunks].map(fileName => link({ rel: 'modulepreload', href: `/${fileName}` })),
        ...[...chunks].flatMap(fileName => [...(bundle[fileName].viteMetadata?.importedCss ?? [])])
            .filter((fileName, index, all) => all.indexOf(fileName) === index)
            .map(fileName => link({ rel: 'preload', as: 'style', href: `/${fileName}` })),
    ];
}

const escapeHtml = text => text.replace(/[&<>"]/g, character => `&#${character.charCodeAt(0)};`);

// The header and an empty main, as views/Application.jsx first renders them, so
// that the page has something to show before the scripts arrive. React replaces
// it with its own copy on its first render. It has its own class rather than
// #application, whose presence tells the tests that React has rendered.
export function shellHtml(dashboards) {
    const links = [
        ...dashboards.map(({ key, menuTitle }) => [`/dashboard/${key}`, menuTitle]),
        ['/contact', 'Contact'],
    ];
    const items = links.map(([href, text]) => `<li><a href="${href}">${escapeHtml(text)}</a></li>`).join('');
    return '<div class="app-shell">' +
        '<header id="main-header"><h1><a href="/">Firefox Public Data Report</a></h1>' +
        `<nav id="main-navigation"><ul>${items}</ul></nav></header>` +
        '<main></main>' +
        '</div>';
}

const emptyRoot = '<div id="root"></div>';

export default function indexHtmlPlugin() {
    return {
        name: 'ensemble-index-html',
        transformIndexHtml: {
            // After Vite's own tags, so that the main script and stylesheet come
            // first, and so that the bundle is there to read.
            order: 'post',
            handler(html, { bundle }) {
                if (!html.includes(emptyRoot)) {
                    throw new Error(`index.html no longer contains ${emptyRoot}, where the page shell goes`);
                }
                return {
                    html: html.replace(emptyRoot, `<div id="root">${shellHtml(config.dashboards)}</div>`),
                    tags: bundle ? preloadTags(bundle) : [],
                };
            },
        },
    };
}
