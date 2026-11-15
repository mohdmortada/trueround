"""Assemble the TrueRound app into (1) a deployable index.html and (2) an Artifact page fragment."""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from tokens_css import compile_tokens

src, ds, out = sys.argv[1], sys.argv[2], sys.argv[3]  # app/src copy, design-system/project copy, output dir
os.makedirs(out, exist_ok=True)
read = lambda p: open(p, encoding='utf-8').read()

tokens = compile_tokens(os.path.join(ds, 'tokens.json'),
                        dark_selectors=['@media (prefers-color-scheme: dark)', ':root[data-theme="dark"]', '.theme-dark'])
bundle_css = re.sub(r"^@import url\([^)]*\);\s*", '', read(os.path.join(ds, 'components', 'bundle.css')))
assert '@import' not in bundle_css
css = tokens + '\n' + bundle_css + '\n' + read(os.path.join(src, 'app.css'))
js = [read(os.path.join(ds, 'components', 'bundle.js')), read(os.path.join(src, 'photos.js')), read(os.path.join(src, 'data.js')), read(os.path.join(src, 'app.js'))]
for chunk in js + [css]:
    assert '</script' not in chunk.lower() and '</style' not in chunk.lower(), 'closing tag inside inline code'

FONTS = 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..900;1,400..900&display=swap'
LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
        'https://cdn.jsdelivr.net/npm/htm@3.1.1/dist/htm.umd.js']
ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%230B0B0B'/%3E"
        "%3Cg transform='translate(13 13) scale(.74)' fill='none' stroke-width='13'%3E%3Cpath stroke='%23FFFFFF' d='M85.93 62.37A38 38 0 0 1 57.25 87.3M49.34 87.99A38 38 0 0 1 12.7 57.25M12.01 49.34A38 38 0 0 1 42.75 12.7'/%3E"
        "%3Cpath stroke='%23E6B800' d='M53.97 12.21A38 38 0 0 1 87.72 54.63'/%3E%3Cpath stroke='%23E6B800' stroke-width='12.5' d='M32 50L48 66L79 35'/%3E%3C/g%3E%3C/svg%3E")

head = f'''<title>TrueRound</title>
<meta name="description" content="TrueRound. Train, track, improve: coach-verified pathway, official competition record and medical clearance for amateur MMA athletes. Concept prototype.">
<link rel="icon" href="{ICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>
{css}
</style>'''
body = '<div id="app"></div>\n' + '\n'.join(f'<script src="{u}"></script>' for u in LIBS) + '\n' + '\n'.join(f'<script>\n{c}\n</script>' for c in js)

open(os.path.join(out, 'index.html'), 'w', encoding='utf-8', newline='\n').write(
    '<!doctype html>\n<html lang="en" data-theme="dark">\n<head>\n<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    '<meta name="theme-color" content="#0B0B0B">\n' + head + '\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
open(os.path.join(out, 'trueround-app.html'), 'w', encoding='utf-8', newline='\n').write(
    head.replace('<title>TrueRound</title>', '<title>TrueRound App</title>\n<meta name="claude:viewport-fit-sides" content="cover">') + '\n' + body + '\n')
print('built', os.path.getsize(os.path.join(out, 'index.html')), 'bytes')
