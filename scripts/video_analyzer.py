#!/usr/bin/env python3
"""
Ferramenta para analisar vídeos usando claude-real-video e salvar resumos no vault.

Uso:
    python scripts/video_analyzer.py "https://youtu.be/..." --why "Qual é o resumo?"
    python scripts/video_analyzer.py "video.mp4" --why "Pontos principais"
"""

import subprocess
import json
import sys
import argparse
from pathlib import Path
from datetime import datetime


def extrair_video(url_ou_arquivo, pergunta):
    """
    Extrai informações do vídeo usando claude-real-video (crv).

    Args:
        url_ou_arquivo: URL do YouTube ou caminho do arquivo local
        pergunta: Pergunta/objetivo da extração (--why)

    Returns:
        Resultado do crv ou None se falhar
    """
    try:
        cmd = ["crv", f'"{url_ou_arquivo}"', "--why", f'"{pergunta}"']
        resultado = subprocess.run(
            " ".join(cmd),
            shell=True,
            capture_output=True,
            text=True,
            timeout=300
        )

        if resultado.returncode != 0:
            print(f"❌ Erro ao processar vídeo: {resultado.stderr}")
            return None

        return resultado.stdout.strip()

    except subprocess.TimeoutExpired:
        print("❌ Timeout ao processar vídeo (>5 min)")
        return None
    except Exception as e:
        print(f"❌ Erro: {e}")
        return None


def salvar_nota_vault(titulo, conteudo, tags=None):
    """
    Salva o resumo do vídeo como nota no vault.

    Args:
        titulo: Título da nota
        conteudo: Conteúdo do resumo
        tags: Lista de tags
    """
    if tags is None:
        tags = ["video-analise", "claude-real-video"]

    # Cria nome do arquivo
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    titulo_kebab = titulo.lower().replace(" ", "-")
    nome_arquivo = f"VIDEO-{timestamp}-{titulo_kebab}.md"

    # Caminho do arquivo
    vault_path = Path("/home/user/JC/vault/Recursos")
    vault_path.mkdir(parents=True, exist_ok=True)
    arquivo = vault_path / nome_arquivo

    # Cria frontmatter
    frontmatter = f"""---
titulo: "{titulo}"
data_analise: "{datetime.now().isoformat()}"
tipo: "video-analise"
tags: {json.dumps(tags)}
---

## Resumo

{conteudo}

---

**Gerado por:** claude-real-video
**Data:** {datetime.now().strftime("%d/%m/%Y %H:%M:%S")}
"""

    # Salva arquivo
    arquivo.write_text(frontmatter, encoding="utf-8")
    print(f"✅ Nota salva: {arquivo}")

    return arquivo


def main():
    parser = argparse.ArgumentParser(
        description="Analisar vídeos e salvar resumos no vault"
    )
    parser.add_argument("video", help="URL do YouTube ou caminho do arquivo local")
    parser.add_argument("--why", default="Qual é o resumo do conteúdo?",
                       help="Pergunta/objetivo da extração")
    parser.add_argument("--titulo", help="Título customizado para a nota")
    parser.add_argument("--tags", nargs="+", help="Tags adicionais")

    args = parser.parse_args()

    print(f"📹 Analisando vídeo: {args.video}")
    print(f"❓ Pergunta: {args.why}")
    print()

    # Extrai conteúdo do vídeo
    resultado = extrair_video(args.video, args.why)

    if resultado:
        # Define título
        titulo = args.titulo or f"Análise de Vídeo - {datetime.now().strftime('%d/%m/%Y')}"

        # Define tags
        tags = ["video-analise", "claude-real-video"]
        if args.tags:
            tags.extend(args.tags)

        # Salva nota
        salvar_nota_vault(titulo, resultado, tags)
        print("\n✅ Análise concluída com sucesso!")
    else:
        print("\n❌ Falha ao analisar vídeo")
        sys.exit(1)


if __name__ == "__main__":
    main()
