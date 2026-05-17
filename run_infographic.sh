#!/bin/bash

# Script para executar o infográfico Claude Prompts localmente

echo "=================================="
echo "🎨 Infográfico Claude Prompts"
echo "=================================="
echo ""
echo "📂 Iniciando servidor local..."
echo ""

# Verifica se está no diretório correto
if [ ! -f "infographic-claude-prompts.html" ]; then
    echo "❌ Erro: arquivo 'infographic-claude-prompts.html' não encontrado!"
    echo "   Certifique-se de estar no diretório correto."
    exit 1
fi

# Tenta usar Python 3 para criar um servidor HTTP simples
if command -v python3 &> /dev/null; then
    PORT=8000
    echo "✅ Servidor iniciado em: http://localhost:$PORT"
    echo "   Abra seu navegador e acesse o endereço acima"
    echo ""
    echo "📊 Seu infográfico está pronto para visualizar!"
    echo "   - Clique em qualquer prompt para copiar"
    echo "   - Adicione suas imagens conforme desejado"
    echo "   - Customize as cores e layout como precisar"
    echo ""
    echo "Pressione Ctrl+C para parar o servidor"
    echo ""

    python3 -m http.server $PORT
else
    echo "❌ Python3 não encontrado"
    echo "   Abra o arquivo manualmente em um navegador:"
    echo "   file://$(pwd)/infographic-claude-prompts.html"
    exit 1
fi
