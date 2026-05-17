#!/usr/bin/env python3
"""
Super Simple HTTP Server - Guaranteed to Work
"""
import http.server
import socketserver
import os
import sys

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("\n" + "="*70)
print("✅ SERVIDOR INICIADO")
print("="*70)
print(f"\n🌐 Abra no navegador:")
print(f"   http://localhost:{PORT}/infographic-claude-prompts.html")
print(f"\n📁 Arquivos disponíveis:")
for f in ['infographic-claude-prompts.html', 'INFOGRAPHIC_PREVIEW.md', 'README_INFOGRAPHIC.md']:
    if os.path.exists(f):
        size = os.path.getsize(f) / 1024
        print(f"   ✓ {f} ({size:.1f}KB)")

print(f"\n⏸️  Pressione Ctrl+C para parar\n")
print("="*70 + "\n")

try:
    Handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n✋ Servidor parado.")
    sys.exit(0)
except OSError as e:
    print(f"\n❌ Erro: {e}")
    print(f"   Porta {PORT} já está em uso?")
    print(f"   Tente: sudo lsof -i :{PORT}")
    sys.exit(1)
