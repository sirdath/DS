#!/usr/bin/env python3
"""
Build a self-contained brandwork viewer for the DS2 brand-materials repo.

Walks the brand repo (v1 / v2 / …), and emits a single `brandwork-viewer.html`
you can open straight from disk (file://, no server, no dependencies):

  - image galleries (PNG/SVG/JPG/WEBP/ICO) with a click-to-zoom lightbox,
  - markdown docs rendered inline,
  - JSON/CSS token files as code blocks with live colour swatches,
  - DOCX/PDF/HTML referenced as open-links.

Re-run any time Stel pushes more (`git -C DS2-BRAND-MATERIALS pull` first):
  python3 scripts/build-brandwork-viewer.py [path-to-brand-repo]

Output: <brand-repo>/brandwork-viewer.html
"""

import html
import os
import re
import sys
from urllib.parse import quote

IMG_EXT = {".png", ".jpg", ".jpeg", ".svg", ".webp", ".gif", ".ico", ".bmp", ".avif"}
CODE_EXT = {".json", ".css", ".scss"}
LINK_EXT = {".docx", ".pdf", ".pptx", ".key", ".ai", ".eps", ".fig", ".html", ".htm", ".zip", ".otf", ".ttf", ".woff", ".woff2"}
SKIP_EXT = {".py", ".gitignore", ".ds_store"}
SKIP_NAMES = {".git", "__pycache__", ".ds_store"}

HEX = re.compile(r"#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "x"


def swatchify(escaped):
    """Prefix every hex colour in already-escaped text with a colour chip."""
    return HEX.sub(lambda m: f'<span class="sw" style="background:{m.group(0)}"></span>{m.group(0)}', escaped)


# ── tiny, dependency-free markdown → HTML (covers the brand docs' constructs) ──
def _inline(s):
    s = html.escape(s)
    s = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", lambda m: f"<em>[image: {m.group(1) or m.group(2)}]</em>", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" target="_blank" rel="noopener">\1</a>', s)
    s = re.sub(r"`([^`]+)`", lambda m: "<code>" + swatchify(m.group(1)) + "</code>", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<em>\1</em>", s)
    return s


def render_markdown(text):
    lines = text.replace("\r\n", "\n").split("\n")
    out, i, n = [], 0, len(lines)
    while i < n:
        line = lines[i]
        if line.strip().startswith("```"):
            i += 1
            buf = []
            while i < n and not lines[i].strip().startswith("```"):
                buf.append(lines[i])
                i += 1
            i += 1
            out.append('<pre class="code">' + swatchify(html.escape("\n".join(buf))) + "</pre>")
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            lvl = len(m.group(1))
            out.append(f"<h{lvl}>" + _inline(m.group(2).strip()) + f"</h{lvl}>")
            i += 1
            continue
        if re.match(r"^\s*([-*_])\1\1+\s*$", line):
            out.append("<hr>")
            i += 1
            continue
        if "|" in line and i + 1 < n and re.match(r"^\s*\|?[\s:|-]+\|[\s:|-]*$", lines[i + 1]):
            header = [c.strip() for c in line.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < n and "|" in lines[i] and lines[i].strip():
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")])
                i += 1
            t = ["<table><thead><tr>" + "".join(f"<th>{_inline(h)}</th>" for h in header) + "</tr></thead><tbody>"]
            for r in rows:
                t.append("<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in r) + "</tr>")
            t.append("</tbody></table>")
            out.append("".join(t))
            continue
        if line.startswith(">"):
            buf = []
            while i < n and lines[i].startswith(">"):
                buf.append(lines[i][1:].lstrip())
                i += 1
            out.append("<blockquote>" + _inline(" ".join(buf)) + "</blockquote>")
            continue
        if re.match(r"^\s*[-*+]\s+", line):
            buf = []
            while i < n and re.match(r"^\s*[-*+]\s+", lines[i]):
                buf.append(re.sub(r"^\s*[-*+]\s+", "", lines[i]))
                i += 1
            out.append("<ul>" + "".join(f"<li>{_inline(x)}</li>" for x in buf) + "</ul>")
            continue
        if re.match(r"^\s*\d+\.\s+", line):
            buf = []
            while i < n and re.match(r"^\s*\d+\.\s+", lines[i]):
                buf.append(re.sub(r"^\s*\d+\.\s+", "", lines[i]))
                i += 1
            out.append("<ol>" + "".join(f"<li>{_inline(x)}</li>" for x in buf) + "</ol>")
            continue
        if not line.strip():
            i += 1
            continue
        buf = [line]
        i += 1
        while i < n and lines[i].strip() and not re.match(r"^(#{1,6}\s|\s*[-*+]\s|\s*\d+\.\s|>|```)", lines[i]):
            buf.append(lines[i])
            i += 1
        out.append("<p>" + _inline(" ".join(buf)) + "</p>")
    return "\n".join(out)


def read_text(path):
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    except Exception as e:  # noqa: BLE001
        return f"(could not read: {e})"


def collect(version_dir):
    """category name -> sorted list of (relpath-within-category, abspath)."""
    cats = {}
    for entry in sorted(os.listdir(version_dir)):
        if entry.lower() in SKIP_NAMES:
            continue
        full = os.path.join(version_dir, entry)
        if os.path.isdir(full):
            cat, files = entry, []
            for root, dirs, names in os.walk(full):
                dirs[:] = [d for d in dirs if d.lower() not in SKIP_NAMES]
                for nm in sorted(names):
                    files.append((os.path.relpath(os.path.join(root, nm), full).replace(os.sep, "/"), os.path.join(root, nm)))
            cats[cat] = sorted(files)
        else:
            cats.setdefault("Overview", []).append((entry, full))
    return cats


def kind(path):
    ext = os.path.splitext(path)[1].lower()
    if ext in IMG_EXT:
        return "img"
    if ext == ".md":
        return "md"
    if ext in CODE_EXT:
        return "code"
    if ext in SKIP_EXT:
        return "skip"
    if ext in LINK_EXT:
        return "link"
    return "skip"


def render_category(out_dir, version, cat, files):
    imgs, docs, codes, links = [], [], [], []
    for relpath, abspath in files:
        k = kind(relpath)
        # URL-encode the path for src/href (spaces, parens, &, # in filenames);
        # keep the human-readable name separately escaped for display.
        href = html.escape(quote(os.path.relpath(abspath, out_dir).replace(os.sep, "/"), safe="/"))
        name = html.escape(relpath)
        if k == "img":
            imgs.append((href, name, relpath))
        elif k == "md":
            docs.append((name, render_markdown(read_text(abspath))))
        elif k == "code":
            codes.append((name, swatchify(html.escape(read_text(abspath)))))
        elif k == "link":
            links.append((href, name))

    if not (imgs or docs or codes or links):
        return "", 0

    sid = f"{slug(version)}-{slug(cat)}"
    count = len(imgs) + len(docs) + len(codes) + len(links)
    parts = [f'<section class="cat" id="{sid}" data-version="{slug(version)}">']
    parts.append(f'<h3 class="cat__title">{html.escape(cat)} <span class="cat__count">{count}</span></h3>')

    for name, dochtml in docs:
        parts.append(f'<article class="doc card" data-name="{name.lower()}"><div class="doc__name">{name}</div><div class="md">{dochtml}</div></article>')

    if imgs:
        parts.append('<div class="grid">')
        for href, name, relpath in imgs:
            parts.append(
                f'<figure class="thumb card" data-name="{name.lower()}">'
                f'<button class="thumb__btn" data-full="{href}" data-cap="{name}" aria-label="Open {name}">'
                f'<img loading="lazy" src="{href}" alt="{name}"></button>'
                f'<figcaption>{html.escape(os.path.basename(relpath))}</figcaption></figure>'
            )
        parts.append("</div>")

    for name, codehtml in codes:
        parts.append(f'<details class="code-card card" data-name="{name.lower()}"><summary>{name}</summary><pre class="code">{codehtml}</pre></details>')

    if links:
        parts.append('<div class="links">')
        for href, name in links:
            parts.append(f'<a class="filelink card" href="{href}" target="_blank" rel="noopener" data-name="{name.lower()}"><span class="filelink__ic">↗</span>{html.escape(os.path.basename(name))}</a>')
        parts.append("</div>")

    parts.append("</section>")
    return "\n".join(parts), count


CSS = """
:root{--bg:#0a0c0e;--surface:#15191c;--surface2:#1d2227;--border:rgba(255,255,255,.09);
--border2:rgba(255,255,255,.18);--text:#eceff1;--muted:#9aa6ae;--ghost:#6b7780;--accent:#5fe3c6;
--mono:ui-monospace,SFMono-Regular,Menlo,monospace;--dur:.18s;--ease:cubic-bezier(.4,0,.2,1)}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--text);
font:15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--accent)}
.top{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;align-items:center;gap:14px;
padding:14px max(20px,env(safe-area-inset-left));border-bottom:1px solid var(--border);
background:rgba(10,12,14,.82);backdrop-filter:blur(12px) saturate(120%)}
.brand{font-weight:700;letter-spacing:-.02em;font-size:1.05rem}
.brand small{display:block;font:600 .62rem/1 var(--mono);letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:3px}
.pills{display:flex;gap:6px;margin-left:auto}
.pill{font:600 .72rem/1 var(--mono);letter-spacing:.04em;text-transform:uppercase;color:var(--muted);
background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:7px 12px;cursor:pointer;min-height:34px;
transition:color var(--dur),border-color var(--dur),background var(--dur)}
.pill:hover{border-color:var(--border2)}
.pill[aria-pressed=true]{color:#04261f;background:var(--accent);border-color:var(--accent)}
.search{font:inherit;font-size:.86rem;color:var(--text);background:var(--surface);border:1px solid var(--border);
border-radius:9px;padding:8px 12px;min-width:200px;min-height:34px}
.search:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.wrap{max-width:1180px;margin:0 auto;padding:26px max(20px,env(safe-area-inset-left)) 80px}
.index{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:26px}
.index a{font:600 .72rem/1 var(--mono);color:var(--muted);text-decoration:none;border:1px solid var(--border);
border-radius:8px;padding:7px 10px;transition:color var(--dur),border-color var(--dur)}
.index a:hover{color:var(--text);border-color:var(--border2)}
.vhead{display:flex;align-items:baseline;gap:12px;margin:38px 0 4px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.vhead h2{margin:0;font-size:1.5rem;letter-spacing:-.02em}
.vhead .desc{color:var(--muted);font-size:.9rem}
.cat{margin:30px 0}
.cat__title{font:600 .74rem/1 var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
margin:0 0 14px;display:flex;align-items:center;gap:8px}
.cat__count{color:var(--ghost);border:1px solid var(--border);border-radius:999px;padding:2px 7px;font-size:.66rem}
.card{background:var(--surface);border:1px solid var(--border);border-radius:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
.thumb{overflow:hidden;display:flex;flex-direction:column;margin:0}
.thumb__btn{border:0;background:#0d0f11;padding:0;cursor:zoom-in;display:block;aspect-ratio:4/3;overflow:hidden}
.thumb__btn:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.thumb img{width:100%;height:100%;object-fit:contain;display:block;
background:conic-gradient(from 45deg,#111 0 25%,#161616 0 50%,#111 0 75%,#161616 0) 0 0/22px 22px}
.thumb figcaption{padding:9px 11px;font-size:.78rem;color:var(--muted);word-break:break-word;border-top:1px solid var(--border)}
.doc{padding:20px 22px;margin-bottom:16px}
.doc__name{font:600 .68rem/1 var(--mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ghost);margin-bottom:12px}
.md h1,.md h2,.md h3{letter-spacing:-.01em;line-height:1.25}
.md h1{font-size:1.4rem;margin:.2em 0 .5em}.md h2{font-size:1.15rem;margin:1.1em 0 .4em}
.md h3{font-size:1rem;margin:1em 0 .3em}.md h4{font-size:.92rem;margin:1em 0 .3em;color:var(--muted)}
.md p{margin:.5em 0;color:#d7dde1}.md ul,.md ol{margin:.5em 0;padding-left:1.3em}.md li{margin:.2em 0}
.md a{word-break:break-word}.md hr{border:0;border-top:1px solid var(--border);margin:1.3em 0}
.md blockquote{margin:.8em 0;padding:.4em 1em;border-left:3px solid var(--border2);color:var(--muted)}
.md table{border-collapse:collapse;width:100%;margin:.8em 0;font-size:.88rem}
.md th,.md td{border:1px solid var(--border);padding:7px 10px;text-align:left}
.md th{background:var(--surface2);font-weight:600}
code{font-family:var(--mono);font-size:.86em;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:.08em .4em}
.code{font-family:var(--mono);font-size:.82rem;line-height:1.5;color:#cdd6db;background:#0d0f11;
border:1px solid var(--border);border-radius:10px;padding:14px 16px;overflow:auto;white-space:pre;margin:0}
.code-card{margin-bottom:12px;overflow:hidden}
.code-card>summary{cursor:pointer;padding:13px 16px;font:600 .8rem/1 var(--mono);color:var(--muted);list-style:none}
.code-card>summary::-webkit-details-marker{display:none}
.code-card>summary::before{content:"▸ ";color:var(--ghost)}
.code-card[open]>summary::before{content:"▾ "}
.code-card>summary:hover{color:var(--text)}
.code-card .code{border:0;border-top:1px solid var(--border);border-radius:0}
.sw{display:inline-block;width:.8em;height:.8em;border-radius:3px;margin-right:.35em;vertical-align:-.05em;
border:1px solid rgba(255,255,255,.25)}
.links{display:flex;flex-wrap:wrap;gap:10px}
.filelink{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:var(--text);font-size:.86rem;
padding:11px 14px;min-height:44px;transition:border-color var(--dur),background var(--dur)}
.filelink:hover{border-color:var(--border2);background:var(--surface2)}
.filelink__ic{color:var(--accent)}
.empty{display:none}
.lb{position:fixed;inset:0;z-index:50;display:none;align-items:center;justify-content:center;
background:rgba(5,6,7,.92);backdrop-filter:blur(4px);padding:34px}
.lb.open{display:flex}
.lb img{max-width:100%;max-height:84vh;object-fit:contain;border-radius:6px;box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}
.lb__cap{position:fixed;bottom:18px;left:0;right:0;text-align:center;color:var(--muted);font:600 .8rem/1.4 var(--mono);padding:0 20px}
.lb__btn{position:fixed;top:50%;transform:translateY(-50%);background:var(--surface);border:1px solid var(--border2);
color:var(--text);width:48px;height:48px;border-radius:50%;font-size:1.4rem;cursor:pointer}
.lb__btn:hover{background:var(--surface2)}.lb__prev{left:20px}.lb__next{right:20px}
.lb__close{position:fixed;top:18px;right:20px;background:var(--surface);border:1px solid var(--border2);color:var(--text);
width:42px;height:42px;border-radius:50%;font-size:1.2rem;cursor:pointer}
.foot{margin-top:50px;padding-top:18px;border-top:1px solid var(--border);color:var(--ghost);font-size:.8rem}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
"""

JS = """
const q=document.getElementById('q'),pills=[...document.querySelectorAll('.pill')];
let ver='all';
function apply(){const term=q.value.trim().toLowerCase();
 document.querySelectorAll('[data-name]').forEach(el=>{
   const okV=ver==='all'||el.closest('[data-version]')?.dataset.version===ver;
   const okT=!term||el.dataset.name.includes(term);
   el.style.display=okV&&okT?'':'none';});
 document.querySelectorAll('.cat').forEach(c=>{
   const any=[...c.querySelectorAll('[data-name]')].some(e=>e.style.display!=='none');
   c.classList.toggle('empty',!any);});
 document.querySelectorAll('.vblock').forEach(b=>{
   const any=[...b.querySelectorAll('.cat')].some(c=>!c.classList.contains('empty'));
   b.classList.toggle('empty',!any);});}
q.addEventListener('input',apply);
pills.forEach(p=>p.addEventListener('click',()=>{ver=p.dataset.ver;
 pills.forEach(x=>x.setAttribute('aria-pressed',x===p));apply();}));
// lightbox
const lb=document.getElementById('lb'),lbImg=document.getElementById('lbImg'),lbCap=document.getElementById('lbCap');
let shots=[],idx=0;
function open(i){idx=(i+shots.length)%shots.length;const b=shots[idx];
 lbImg.src=b.dataset.full;lbCap.textContent=b.dataset.cap;lb.classList.add('open');}
function refresh(){shots=[...document.querySelectorAll('.thumb__btn')].filter(b=>b.closest('.thumb').style.display!=='none');}
document.addEventListener('click',e=>{const b=e.target.closest('.thumb__btn');
 if(b){refresh();open(shots.indexOf(b));}});
document.getElementById('lbClose').onclick=()=>lb.classList.remove('open');
document.getElementById('lbPrev').onclick=()=>open(idx-1);
document.getElementById('lbNext').onclick=()=>open(idx+1);
lb.addEventListener('click',e=>{if(e.target===lb)lb.classList.remove('open');});
document.addEventListener('keydown',e=>{if(!lb.classList.contains('open'))return;
 if(e.key==='Escape')lb.classList.remove('open');
 if(e.key==='ArrowLeft')open(idx-1);if(e.key==='ArrowRight')open(idx+1);});
"""

VERSION_DESC = {
    "v2": "Active redesign — translucent glass, space-grey surfaces, restrained cool light, minimal luxury.",
    "v1": "Archived first-generation system. Preserved as-is.",
}


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(here, "..", "DS2-BRAND-MATERIALS")
    root = os.path.abspath(root)
    if not os.path.isdir(root):
        sys.exit(f"brand repo not found: {root}")
    out_path = os.path.join(root, "brandwork-viewer.html")

    # Versions = top-level dirs (v1, v2, …); top-level files → a 'Repo' block.
    versions, root_files = [], []
    for entry in sorted(os.listdir(root)):
        if entry.lower() in SKIP_NAMES or entry == "brandwork-viewer.html":
            continue
        full = os.path.join(root, entry)
        if os.path.isdir(full):
            versions.append(entry)
        elif kind(entry) != "skip":
            root_files.append((entry, full))

    body, index, total = [], [], 0
    order = sorted(versions, key=lambda v: (v != "v2", v))  # v2 (active) first
    for v in order:
        cats = collect(os.path.join(root, v))
        rendered, vcount, idx_links = [], 0, []
        for cat in sorted(cats):
            htmlblock, c = render_category(root, v, cat, cats[cat])
            if c:
                rendered.append(htmlblock)
                vcount += c
                idx_links.append(f'<a href="#{slug(v)}-{slug(cat)}">{html.escape(cat)}</a>')
        if not rendered:
            continue
        total += vcount
        desc = VERSION_DESC.get(v.lower(), "")
        index.append(f'<a href="#{slug(v)}">{html.escape(v.upper())}</a>')
        body.append(
            f'<div class="vblock" data-version="{slug(v)}">'
            f'<div class="vhead" id="{slug(v)}"><h2>{html.escape(v.upper())}</h2><span class="desc">{html.escape(desc)}</span></div>'
            f'<div class="index">{"".join(idx_links)}</div>'
            + "\n".join(rendered)
            + "</div>"
        )

    if root_files:
        block, c = render_category(root, "Repo", "Files", root_files)
        if c:
            total += c
            body.insert(0, f'<div class="vblock" data-version="repo"><div class="vhead" id="repo"><h2>Repo</h2><span class="desc">Top-level files.</span></div>{block}</div>')
            index.insert(0, '<a href="#repo">REPO</a>')

    pills = '<button class="pill" data-ver="all" aria-pressed="true">All</button>' + "".join(
        f'<button class="pill" data-ver="{slug(v)}" aria-pressed="false">{html.escape(v.upper())}</button>' for v in order
    )

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>DS2 Brandwork Viewer</title>
<style>{CSS}</style></head>
<body>
<header class="top">
  <div class="brand"><small>DS2 · Brand materials</small>Brandwork Viewer</div>
  <input id="q" class="search" type="search" placeholder="Search files, docs…" aria-label="Search brandwork">
  <div class="pills" role="group" aria-label="Filter by version">{pills}</div>
</header>
<main class="wrap">
  <nav class="index" aria-label="Jump to">{"".join(index)}</nav>
  {"".join(body)}
  <p class="foot">{total} items across {len(order)} version(s) · generated from <code>{html.escape(os.path.basename(root))}</code> · re-run <code>scripts/build-brandwork-viewer.py</code> after pulling Stel's updates.</p>
</main>
<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="Image preview">
  <button class="lb__close" id="lbClose" aria-label="Close">✕</button>
  <button class="lb__btn lb__prev" id="lbPrev" aria-label="Previous">‹</button>
  <img id="lbImg" alt="">
  <button class="lb__btn lb__next" id="lbNext" aria-label="Next">›</button>
  <div class="lb__cap" id="lbCap"></div>
</div>
<script>{JS}</script>
</body></html>"""

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"wrote {out_path}")
    print(f"  {total} items · versions: {', '.join(order) or '—'}")


if __name__ == "__main__":
    main()
