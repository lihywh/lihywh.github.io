#!/usr/bin/env python3
"""Regenerate the static More apps section on every registered download page."""

import argparse
from html import escape
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
START = '<!-- app-catalog:start -->'
END = '<!-- app-catalog:end -->'
ASSETS = (
    '<link rel="stylesheet" href="/download/more-apps.css">\n'
    '<script src="/download/more-apps.js" defer></script>\n'
)

def site_file(path):
    resolved = (ROOT / path.lstrip('/')).resolve()
    if not resolved.is_relative_to(ROOT):
        raise ValueError(f'Path is outside the site: {path}')
    return resolved

def local_label(app):
    english, simplified, traditional = (escape(app[key], quote=True) for key in ('en', 'hans', 'hant'))
    return f'data-catalog-hans="{simplified}" data-catalog-hant="{traditional}">{english}'

def render_catalog(apps, current):
    others = [app for app in apps if app['page'] != current['page']]
    others.sort(key=lambda app: app['group'] != current['group'])
    title = local_label({'en': 'More apps', 'hans': '更多应用', 'hant': '更多應用程式'})
    lines = [START, '<section class="app-catalog" aria-labelledby="app-catalog-title">',
             f'  <h2 id="app-catalog-title" {title}</h2>', '  <ul>']
    for app in others:
        page = escape(app['page'], quote=True)
        lines.extend([
            f'    <li><a href="{page}">',
            f'      <img src="{page}icon.png" width="28" height="28" alt="" loading="lazy">',
            f'      <span {local_label(app)}</span>',
            '      <span class="catalog-arrow" aria-hidden="true">›</span>',
            '    </a></li>',
        ])
    return '\n'.join([*lines, '  </ul>', '</section>', END])

def update_html(html, section):
    if ASSETS not in html:
        head_end = re.search(r'</head>|<body\b|<main\b', html)
        if not head_end:
            raise ValueError('Expected a head or body to insert catalogue assets')
        html = html[:head_end.start()] + ASSETS + html[head_end.start():]
    if START in html or END in html:
        if html.count(START) != 1 or html.count(END) != 1 or html.index(START) > html.index(END):
            raise ValueError('Invalid catalogue markers')
        start = html.index(START)
        end = html.index(END, start) + len(END)
        return html[:start] + section + html[end:]
    if html.count('</main>') != 1:
        raise ValueError('Expected one main element to insert catalogue')
    return html.replace('</main>', section + '\n</main>')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='report pages that need regeneration')
    options = parser.parse_args()
    apps = json.loads(site_file('download/apps.json').read_text(encoding='utf-8'))
    paths = [app['page'] for app in apps]
    if len(paths) != len(set(paths)):
        raise ValueError('Duplicate download page in catalogue')
    changes = []
    for app in apps:
        page = app['page']
        if not re.fullmatch(r'/(?:[a-z0-9-]+/)+', page):
            raise ValueError(f'Invalid download page: {page}')
        if not site_file(page + 'icon.png').is_file():
            raise ValueError(f'Missing app icon: {page}')
        path = site_file(page + 'index.html')
        before = path.read_text(encoding='utf-8')
        after = update_html(before, render_catalog(apps, app))
        if after != before:
            changes.append((path, after))
    if options.check and changes:
        parser.exit(1, '\n'.join(f'Needs regeneration: {path.relative_to(ROOT)}' for path, _ in changes) + '\n')
    for path, content in changes:
        path.write_text(content, encoding='utf-8')
    print(f'{len(apps)} download pages, {len(changes)} to regenerate' if options.check
          else f'{len(apps)} download pages, {len(changes)} updated')

if __name__ == '__main__':
    main()
