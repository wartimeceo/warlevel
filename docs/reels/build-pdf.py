import re, base64, pathlib, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else 'tournage-317.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'print-317.html'
BREAKS = sys.argv[3:] or ['Script minuté', 'Plan de tournage', 'Avant le jour J', 'Publication</span>']
src = open(SRC, encoding='utf-8').read()
src = re.sub(r'<script>.*?</script>', '', src, flags=re.S)
src = re.sub(r'\s*<button class="reset".*?</button>', '', src, flags=re.S)
faces = open('fonts-inline.css', encoding='utf-8').read()

print_css = """
<style>
@page { size:A4; margin:14mm 13mm 12mm; }
html{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
:root{
  --paper:#FFFFFF; --sheet:#F6F3F2; --sheet-2:#EFEBEA;
  --ink:#151213; --ink-2:#443C3B; --muted:#6E6564;
  --rule:#C6BFBE; --rule-soft:#DCD6D5;
  --accent:#A23126; --accent-ink:#8A281E; --accent-wash:#F6E7E4;
}
body{ font-size:9.4pt; line-height:1.48; background:#fff; }
.wrap{ max-width:none; padding:0; }
header{ padding-top:0; }
h1{ font-size:27pt; margin-bottom:.5rem; }
.sub{ font-size:10.5pt; margin-bottom:1.1rem; }
h2{ font-size:14.5pt; }
h3{ font-size:10.6pt; }
.lede{ font-size:9.4pt; }
.tag-row{ margin-bottom:1rem; }
.facts{ grid-template-columns:repeat(5,1fr); }
.fact{ padding:.6rem .65rem; }
.fact dt{ font-size:.56rem; }
.fact dd{ font-size:8.4pt; line-height:1.25; }
.rule-box{ margin-top:1.3rem; padding:.85rem 1rem; }
section{ margin-top:1.6rem; padding-top:.9rem; }
section.pb{ break-before:page; page-break-before:always; margin-top:0; padding-top:0; border-top:0; }
section.pb .sec-head{ border-top:2px solid var(--ink); padding-top:.6rem; }
.sec-head{ margin-bottom:1rem; }
.beat{ padding:.85rem 0; }
.beat-rail .num{ font-size:1.5rem; }
.beat-title{ font-size:10.8pt; }
.beat-role{ margin-bottom:.55rem; }
.vo{ font-size:8.9pt; line-height:1.6; padding:.6rem .75rem; margin-bottom:.6rem; }
.spec{ margin-bottom:.5rem; gap:.25rem .8rem; }
.spec dd{ font-size:9.1pt; }
.screen{ font-size:7.6pt; line-height:1.5; padding:.45rem .55rem; white-space:pre-wrap; }
.note{ font-size:9pt; padding-top:.45rem; }
.card-317{ padding:1rem; font-size:.95rem; }
table{ min-width:0; font-size:8.9pt; }
th,td{ padding:.34rem .55rem; }
.tbl-scroll, .screen{ overflow:visible; }
.setup{ margin-bottom:1.3rem; }
.tl{ min-width:0; }
.tl-seg{ padding:.45rem .35rem; }
.tl-seg .l{ font-size:.48rem; white-space:normal; overflow:hidden; overflow-wrap:anywhere; hyphens:auto; text-overflow:clip; line-height:1.2; }
.tl-seg .d{ font-size:.48rem; white-space:normal; line-height:1.25; }
.tl-seg .n{ font-size:.85rem; }
.check li{ padding:.2rem 0; }
.check label, .steps li{ font-size:9.2pt; }
.lines li{ font-size:8.9pt; }
.caption-box{ font-size:8.9pt; padding:.8rem; }
footer{ margin-top:1.8rem; }
.beat, .setup, .rule-box, .guards li, .caption-box, .tl-scroll, .facts,
tr, .check li, .lines li, .steps li, footer{ break-inside:avoid; page-break-inside:avoid; }
h2,h3,.sec-head{ break-after:avoid; page-break-after:avoid; }
input[type="checkbox"]{
  -webkit-appearance:none; appearance:none; border-radius:0;
  width:10px; height:10px; border:1px solid var(--ink-2); background:#fff; margin-top:.3rem;
}
.beat.peak{ margin-left:0; padding-left:.8rem; }
.beat-head{ margin-bottom:.05rem; }
.badge{ font-size:.52rem; padding:.1rem .3rem; }
</style>
"""

head, body = src.split('<div class="wrap">', 1)
head = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', head)
head = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com[^>]*>',
              '<style>\n' + faces + '\n</style>', head)
doc = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
       + head + print_css + '</head>\n<body style="margin:0">\n<div class="wrap">'
       + body + '\n</body>\n</html>')

# force a page break only before the four heavy sections
for anchor in BREAKS:
    i = doc.find(anchor)
    j = doc.rfind('<section>', 0, i)
    doc = doc[:j] + '<section class="pb">' + doc[j+len('<section>'):]
pathlib.Path(OUT).write_text(doc, encoding='utf-8')
print('ok', doc.count('section class="pb"'))
