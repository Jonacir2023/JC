#!/usr/bin/env python3
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')
css=(ROOT/'styles.css').read_text(encoding='utf-8')
data=(ROOT/'data.js').read_text(encoding='utf-8')
app=(ROOT/'app.js').read_text(encoding='utf-8')

# Standalone não registra Service Worker, mesmo quando aberto por preview HTTP.
app=re.sub(r"if\(location\.protocol!==['\"]file:['\"]&&['\"]serviceWorker['\"]in navigator\)navigator\.serviceWorker\.register\(['\"]\./sw\.js['\"]\)\.catch\(\(\)=>\{\}\);?",'',app)
html=re.sub(r'\s*<link rel="manifest"[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="styles.css">',f'<style>\n{css}\n</style>')
html=html.replace('<script src="data.js"></script>',f'<script>\n{data}\n</script>')
html=html.replace('<script src="app.js"></script>',f'<script>\n{app}\n</script>')
html=html.replace('<meta name="theme-color" content="#102b47">','''<meta name="theme-color" content="#102b47">\n  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; worker-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'">\n  <meta name="referrer" content="no-referrer">''')
html=html.replace('<body>','''<!-- BUILDLy V2.2 Feature Complete — standalone 100% offline. -->\n<body>''',1)

for name in ['BUILDLy_Premium_V2_STANDALONE.html','BUILDLy_Premium_V2_STANDALONE_OFFLINE.html']:
    (ROOT/name).write_text(html,encoding='utf-8')
print('Standalone V2.2 gerado:',len(html),'bytes')
