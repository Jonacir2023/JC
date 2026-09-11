from pathlib import Path
import re

base = Path(__file__).resolve().parents[1]
p = base / 'BUILDLy_Premium_V2_STANDALONE_OFFLINE.html'
assert p.exists() and p.stat().st_size > 0, 'standalone offline ausente'
s = p.read_text(encoding='utf-8')

checks = {
    'sem_registro_service_worker': not re.search(r'\.serviceWorker\.register\s*\(', s),
    'sem_sw_js': 'sw.js' not in s,
    'sem_url_http': not re.search(r'https?://', s),
    'sem_fetch': not re.search(r'\bfetch\s*\(', s),
    'sem_xhr': not re.search(r'new\s+XMLHttpRequest\b|XMLHttpRequest\s*\(', s),
    'sem_websocket': not re.search(r'new\s+WebSocket\s*\(', s),
    'sem_eventsource': not re.search(r'new\s+EventSource\s*\(', s),
    'sem_script_externo': not re.search(r'<script[^>]+src=', s, re.I),
    'sem_css_externo': not re.search(r'<link[^>]+href=', s, re.I),
    'csp_bloqueia_rede': "connect-src 'none'" in s and "worker-src 'none'" in s,
}

falhas = [k for k, v in checks.items() if not v]
assert not falhas, f'falhas no standalone offline: {falhas}'

launcher = base / 'ABRIR_BUILDLY_OFFLINE.command'
assert launcher.exists() and launcher.stat().st_size > 0, 'launcher offline ausente'
lt = launcher.read_text(encoding='utf-8')
assert 'BUILDLy_Premium_V2_STANDALONE_OFFLINE.html' in lt
assert 'open "$HTML"' in lt

print('OK standalone offline')
for k in checks:
    print('  PASS', k)
