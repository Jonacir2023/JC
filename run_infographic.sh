#!/bin/bash

# Script para executar o infográfico Claude Prompts com servidor HTTP
# Permite acesso em iPhone, iPad e outros dispositivos móveis

clear

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║  🎨 Infográfico Claude Prompts - Servidor HTTP                ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Verifica se está no diretório correto
if [ ! -f "infographic-claude-prompts.html" ]; then
    echo "❌ Erro: arquivo 'infographic-claude-prompts.html' não encontrado!"
    echo "   Certifique-se de estar no diretório correto: /home/user/JC"
    exit 1
fi

# Verifica Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Erro: Python3 não encontrado"
    echo "   Instale com: apt-get install python3"
    exit 1
fi

# Executa o servidor
echo "🚀 Iniciando servidor HTTP..."
echo ""

if [ -f "server.py" ]; then
    # Usa servidor customizado se disponível
    python3 server.py
else
    # Fallback para servidor padrão do Python
    PORT=8000
    HOSTNAME=$(hostname -I | awk '{print $1}')

    echo "✅ Servidor iniciado!"
    echo ""
    echo "📍 Acesse em:"
    echo "   🖥️  Desktop:  http://localhost:$PORT/infographic-claude-prompts.html"
    echo "   📱 Mobile:   http://$HOSTNAME:$PORT/infographic-claude-prompts.html"
    echo ""
    echo "Pressione Ctrl+C para parar"
    echo ""

    python3 -m http.server $PORT
fi
