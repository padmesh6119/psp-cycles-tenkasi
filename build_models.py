#!/usr/bin/env python3
"""Render models.json into the .collection-grid of each category page.

Run after editing models.json:   python3 build_models.py
"""

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
DATA = json.loads((ROOT / 'models.json').read_text(encoding='utf-8'))

CATEGORIES = {
    'mtb':      '1534150034764-046bf225d3fa',
    'gear':     '1541625602330-2277a4c46182',
    'disc':     '1532298229144-0ec0c57515c7',
    'hybrid':   '1576435728678-68d0fbf94e91',
    'electric': '1485965120184-e220f721d03e',
    'kids':     '1571068316344-75bc76f77890',
    'road':     '1517649763962-0c623066013b',
    'bmx':      '1571333250630-f0230c320b6d',
    'folding':  '1558618666-fcd25c85cd64',
    'city':     '1507035895480-2b3156c31fc8',
    'touring':  '1511994298241-608e28f14fde',
    'cruiser':  '1571188654248-7a89213915f7',
}


def card(model, slug, index):
    """A catalogue entry. No photo: we have no real product shots, and
    repeating one stock image 30 times per page reads as filler."""
    brand = html.escape(model['brand'])
    name = html.escape(model['name'])
    spec = html.escape(model.get('spec', '') or '')
    spec_line = f'\n                    <p class="model-spec">{spec}</p>' if spec else ''

    return f'''                <a class="model-card" href="index_pro.html#contact" data-brand="{brand}">
                    <span class="model-brand">{brand}</span>
                    <h3>{name}</h3>{spec_line}
                    <span class="model-cta">Enquire <i class="fas fa-arrow-right" aria-hidden="true"></i></span>
                </a>'''


def build(slug):
    path = ROOT / f'{slug}.html'
    if not path.exists():
        print(f'  skip {slug}: no page', file=sys.stderr)
        return 0

    models = DATA[slug]
    grid = '\n'.join(card(m, slug, i) for i, m in enumerate(models))

    source = path.read_text(encoding='utf-8')
    opening = '<div class="collection-grid">'
    start = source.index(opening)
    i, depth = start + len(opening), 1
    for tag in re.finditer(r'<(/?)div\b[^>]*>', source[i:]):
        depth += -1 if tag.group(1) else 1
        if depth == 0:
            end = i + tag.start()
            break
    else:
        raise SystemExit(f'{slug}: could not find the end of .collection-grid')

    out = source[:start + len(opening)] + '\n' + grid + '\n            ' + source[end:]

    # keep the count line under the page intro honest
    count_html = (f'<p class="collection-count">{len(models)} '
                  f'model{"s" if len(models) != 1 else ""} listed &middot; '
                  f'stock varies, please call to confirm availability</p>')
    if 'collection-count' in out:
        out = re.sub(r'<p class="collection-count">.*?</p>', count_html, out, flags=re.S)
    else:
        out = re.sub(r'(<section class="collection-header">.*?<p>.*?</p>)',
                     r'\1\n            ' + count_html, out, flags=re.S, count=1)

    path.write_text(out, encoding='utf-8')
    return len(models)


if __name__ == '__main__':
    total = 0
    for slug in CATEGORIES:
        n = build(slug)
        total += n
        print(f'  {slug:9} {n:3} models')
    print(f'  {"total":9} {total:3}')
