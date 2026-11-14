"""Compile tokens.json to CSS custom properties (local testing + the app's own copy)."""
import json, re, sys

def compile_tokens(path, scope_light=':root', dark_selectors=None):
    t = json.load(open(path, encoding='utf-8'))
    themes = [th['id'] for th in t['color']['themes']]
    first = themes[0]
    def val(v, theme):
        if isinstance(v, str):
            raw = v
        else:
            raw = v.get(theme, v.get(first))
        m = re.fullmatch(r'\{(.+)\}', raw)
        return f'var(--{m.group(1)})' if m else raw
    blocks = {th: [] for th in themes}
    for fam in ('color', 'shadow'):
        for tok in t.get(fam, {}).get('tokens', []):
            for th in themes:
                if th == first or not isinstance(tok['value'], str):
                    blocks[th].append(f"  --{tok['name']}: {val(tok['value'], th)};")
    plain = []
    for fam, body in t.items():
        if fam in ('color', 'shadow', 'type', 'name', 'version') or not isinstance(body, dict):
            continue
        for tok in body.get('tokens', []):
            plain.append(f"  --{tok['name']}: {tok['value']};")
    for key, stack in t['type']['families'].items():
        plain.append(f"  --font-{key}: {stack};")
    out = [f"{scope_light} {{\n" + '\n'.join(blocks[first] + plain) + "\n}"]
    dark = '\n'.join(blocks.get('dark', []))
    if dark:
        sels = dark_selectors or ['[data-theme="dark"]']
        for s in sels:
            if s.startswith('@media'):
                out.append(f"{s} {{ :root:not([data-theme=\"light\"]) {{\n{dark}\n  color-scheme: dark;\n}} }}")
            else:
                out.append(f"{s} {{\n{dark}\n  color-scheme: dark;\n}}")
    return '\n'.join(out)

if __name__ == '__main__':
    print(compile_tokens(sys.argv[1], dark_selectors=['@media (prefers-color-scheme: dark)', ':root[data-theme="dark"]']))
