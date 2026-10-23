import json, re, subprocess, sys
sys.path.insert(0, sys.argv[1]); import da
D = sys.argv[2]
src = open(D+'/src/orig.js', encoding='utf-8').read()
subprocess.run(['node', sys.argv[1]+'/lits.mjs', D+'/src/orig.js', D+'/lits.json'], check=True)
L = json.load(open(D+'/lits.json'))
# acorn positions are UTF-16 code units; convert via utf-16 mapping
u16 = src.encode('utf-16-le')
def u16slice_to_py(s, e):
    a = len(u16[:s*2].decode('utf-16-le')); b = a + len(u16[s*2:e*2].decode('utf-16-le')); return a, b
used = set(); edits = []
def tr_html(h):
    for a, b in da.HTML_SUB:
        if a in h: used.add(('H', a)); h = h.replace(a, b)
    def tnode(m):
        t = m.group(1); k = t.strip()
        if k in da.EX: used.add(k); return '>' + t.replace(k, da.EX[k]) + '<'
        return m.group(0)
    h = re.sub(r'>([^<>]+)<', tnode, h)
    def attr(m):
        k = m.group(2)
        if k in da.EX: used.add(k); return m.group(1) + '="' + da.EX[k] + '"'
        return m.group(0)
    h = re.sub(r'((?:aria-label|title|placeholder|alt|data-label))="([^"]*)"', attr, h)
    return h
for x in L:
    v = x['v']; nv = None
    if len(v) > 2000:
        if x['line'] == 2106: nv = tr_html(v)
        else: continue
    elif (x['line'], v) in da.LINE: nv = da.LINE[(x['line'], v)]; used.add((x['line'], v))
    elif v in da.EX: nv = da.EX[v]; used.add(v)
    else:
        t = v
        for a, b in da.SUB:
            if a in t: t = t.replace(a, b); used.add(('S', a))
        if t != v: nv = t
    if nv is not None and nv != v:
        a, b = u16slice_to_py(x['s'], x['e'])
        edits.append((a, b, json.dumps(nv, ensure_ascii=False)))
for a, b, r in sorted(edits, reverse=True):
    src = src[:a] + r + src[b:]
for a, b in da.CODE:
    n = src.count(a)
    if n == 0: print('CODE MISS:', a)
    src = src.replace(a, b)
open(D+'/src/da.js', 'w', encoding='utf-8').write(src)
miss = [k for k in da.EX if k not in used] + [k for k in da.LINE if k not in used]
miss += [('S',a) for a,_ in da.SUB if ('S',a) not in used] + [('H',a) for a,_ in da.HTML_SUB if ('H',a) not in used]
print(len(edits), 'edits; unused keys:', miss)
