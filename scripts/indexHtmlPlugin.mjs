import config from '../src/config.json' with { type: 'json' };

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
        transformIndexHtml(html) {
            if (!html.includes(emptyRoot)) {
                throw new Error(`index.html no longer contains ${emptyRoot}, where the page shell goes`);
            }
            return html.replace(emptyRoot, `<div id="root">${shellHtml(config.dashboards)}</div>`);
        },
    };
}
