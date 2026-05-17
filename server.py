#!/usr/bin/env python3
"""
Simple HTTP Server for Infographic Claude Prompts
Serves the infographic on all network interfaces for mobile access
"""

import http.server
import socketserver
import os
import sys
import socket
from pathlib import Path

PORT = 8000
HANDLER = http.server.SimpleHTTPRequestHandler

def get_local_ip():
    """Get local network IP address"""
    try:
        # Create socket to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def main():
    # Change to script directory
    script_dir = Path(__file__).parent.absolute()
    os.chdir(script_dir)

    # Get IP addresses
    localhost_ip = "127.0.0.1"
    local_ip = get_local_ip()

    # Create HTTP server
    with socketserver.TCPServer(("", PORT), HANDLER) as httpd:
        print("\n" + "="*70)
        print("🌐 Servidor HTTP Iniciado com Sucesso!")
        print("="*70)
        print(f"\n📱 Acesse o Infográfico em seu dispositivo:\n")
        print(f"  🖥️  Desktop/Laptop:")
        print(f"      http://localhost:{PORT}/infographic-claude-prompts.html")
        print(f"\n  📱 Smartphone/Tablet (mesma rede WiFi):")
        print(f"      http://{local_ip}:{PORT}/infographic-claude-prompts.html")
        print(f"\n  🍎 iPhone (se na mesma rede):")
        print(f"      http://{local_ip}:{PORT}/infographic-claude-prompts.html")
        print(f"\n  📋 Preview Markdown (qualquer dispositivo):")
        print(f"      http://{local_ip}:{PORT}/INFOGRAPHIC_PREVIEW.md")

        print(f"\n{'='*70}")
        print(f"Porta: {PORT}")
        print(f"Diretório: {script_dir}")
        print(f"Status: ✅ Ativo")
        print(f"{'='*70}")
        print(f"\n⚠️  IMPORTANTE PARA IPHONE:")
        print(f"   1. Certifique-se que iPhone está na MESMA REDE WiFi")
        print(f"   2. Use o endereço IP: http://{local_ip}:{PORT}/infographic-claude-prompts.html")
        print(f"   3. NÃO use 'localhost' (apenas funciona em localhost)")
        print(f"   4. Se não funcionar, verifique o firewall")

        print(f"\n📋 Arquivos disponíveis:")
        print(f"   ✓ infographic-claude-prompts.html (PRINCIPAL)")
        print(f"   ✓ INFOGRAPHIC_PREVIEW.md")
        print(f"   ✓ README_INFOGRAPHIC.md")
        print(f"   ✓ AUDIT_REPORT.md")

        print(f"\n⏸️  Pressione Ctrl+C para parar o servidor\n")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✋ Servidor parado.")
            sys.exit(0)

if __name__ == "__main__":
    main()
