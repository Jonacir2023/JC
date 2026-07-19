# Claude Real Video - Integração no Repositório

Integração da ferramenta `claude-real-video` (crv) para analisar vídeos e extrair resumos automaticamente.

## Instalação

```bash
pip install claude-real-video
npx skills add HUANGCHIHHUNGLeo/claude-real-video
```

## Uso

### 1. Linha de Comando Direta (crv)

```bash
# Resumo básico
crv "https://youtu.be/VIDEO_ID" --why "Qual é o resumo?"

# Pontos principais
crv "https://youtu.be/VIDEO_ID" --why "Quais são os pontos principais?"

# Arquivo local
crv "video.mp4" --why "Do que trata este vídeo?"
```

### 2. Script Python Integrado

O script `scripts/video_analyzer.py` automatiza o processo e salva resumos no vault:

```bash
# Uso básico
python scripts/video_analyzer.py "https://youtu.be/VIDEO_ID"

# Com pergunta customizada
python scripts/video_analyzer.py "https://youtu.be/VIDEO_ID" \
  --why "Quais são os pontos principais?"

# Com título e tags
python scripts/video_analyzer.py "https://youtu.be/VIDEO_ID" \
  --titulo "Análise de Obra" \
  --tags construcao planejamento
```

### 3. Integração com N8N

Exemplo de configuração no N8N:

```json
{
  "nodes": [
    {
      "name": "Execute Command",
      "type": "n8n-nodes-base.executeCommand",
      "parameters": {
        "command": "crv '{{ $json.video_url }}' --why '{{ $json.extraction_goal }}'"
      }
    }
  ]
}
```

## Saída

Os resumos são salvos em `vault/Recursos/` com formato:

```
VIDEO-20260719-120000-titulo-do-video.md
```

### Frontmatter

```yaml
---
titulo: "Título do Vídeo"
data_analise: "2026-07-19T12:00:00"
tipo: "video-analise"
tags: ["video-analise", "claude-real-video"]
---
```

## Funcionalidades

✅ Extração de keyframes
✅ Transcrição de áudio
✅ Resumos automáticos
✅ Análise de conteúdo
✅ Integração com vault
✅ Suporte a YouTube e arquivos locais

## Limitações

- Vídeos privados não podem ser acessados
- Requer conexão com internet para YouTube
- Processamento leva alguns minutos (depende da duração)

## Variáveis de Ambiente

Nenhuma configuração adicional necessária. A ferramenta usa `yt-dlp` internamente.

## Troubleshooting

**Erro: "private video"**
- Verifique se o vídeo é público
- YouTube pode bloquear downloads em algumas regiões

**Erro: "command not found: crv"**
- Reinstale: `pip install claude-real-video`
- Adicione ao PATH se necessário

## Referências

- [claude-real-video no GitHub](https://github.com/HUANGCHIHHUNGLeo/claude-real-video)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
