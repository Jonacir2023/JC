#!/usr/bin/env python3
"""
importar_sinapi_mg.py
Converte os XLSX oficiais SINAPI-MG (Composições Analítico + Preço de Insumos)
em CSV consolidado para uso no vault/orçamento.

CONTEXTO: a CEF bloqueia download automatizado (bot) dos XLSX no site oficial.
Este script NÃO baixa da web. Ele processa arquivos que já estão no repositório,
em dados-brutos/, subidos manualmente por você todo mês.

Fluxo mensal:
  1. Baixe no site da CEF (SINAPI > MG > mês vigente > Não Desonerado):
     - Composições Analítico
     - Preço de Insumos
  2. Suba os 2 arquivos em dados-brutos/ (nome original, sem alterar)
  3. Rode este script (local ou via GitHub Actions no push/dispatch)

Uso:
    python scripts/importar_sinapi_mg.py --csv
    python scripts/importar_sinapi_mg.py --csv --dir dados-brutos --out vault/Recursos/sinapi_mg_industrial.csv
"""

import argparse
import csv
import glob
import os
import re
import sys
from datetime import datetime

import openpyxl


def br_to_float(s):
    if s is None:
        return None
    s = str(s).strip()
    if not s:
        return None
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def achar_arquivo(diretorio, padrao):
    """Encontra o XLSX mais recente que bate com o padrão (por nome, ordenação desc)."""
    candidatos = sorted(glob.glob(os.path.join(diretorio, padrao)), reverse=True)
    return candidatos[0] if candidatos else None


def extrair_referencia(nome_arquivo):
    """Extrai AAAAMM do nome do arquivo (ex: ..._MG_202412_...)."""
    m = re.search(r"_(\d{6})_", nome_arquivo)
    return m.group(1) if m else "desconhecida"


def parse_analitico(caminho):
    """Lê o XLSX Analítico e retorna lista de dicts (1 linha por composição)."""
    wb = openpyxl.load_workbook(caminho, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))

    # Header está na linha 6 (index 5), igual ao padrão SINAPI/MG validado
    header_idx = None
    for i, row in enumerate(rows):
        if row and any(c and "CODIGO DA COMPOSICAO" in str(c).upper() for c in row):
            header_idx = i
            break
    if header_idx is None:
        raise ValueError(f"Header 'CODIGO DA COMPOSICAO' nao encontrado em {caminho}")

    header = [str(c).strip() if c else "" for c in rows[header_idx]]
    # Mantem apenas a PRIMEIRA ocorrencia de cada nome de coluna: o layout SINAPI
    # repete "CUSTO TOTAL" (nivel composicao) e novamente no bloco de item
    # (nivel item) - sem isso o dict sobrescreve com a coluna errada.
    col = {}
    for idx, h in enumerate(header):
        if h not in col:
            col[h] = idx

    def val(row, nome):
        idx = col.get(nome)
        return row[idx] if idx is not None and idx < len(row) else None

    composicoes = []
    for row in rows[header_idx + 1:]:
        if not row or val(row, "CODIGO DA COMPOSICAO") is None:
            continue
        # Linha de cabeçalho de composição = TIPO ITEM vazio
        tipo_item = val(row, "TIPO ITEM")
        if tipo_item not in (None, ""):
            continue
        try:
            codigo = int(val(row, "CODIGO DA COMPOSICAO"))
        except (TypeError, ValueError):
            continue

        composicoes.append({
            "codigo": codigo,
            "descricao": str(val(row, "DESCRICAO DA COMPOSICAO") or "").strip(),
            "unidade": str(val(row, "UNIDADE") or "").strip(),
            "classe": str(val(row, "DESCRICAO DA CLASSE") or "").strip(),
            "grupo": str(val(row, "DESCRICAO DO TIPO 1") or "").strip(),
            "custo_total": br_to_float(val(row, "CUSTO TOTAL")),
            "custo_mao_obra": br_to_float(val(row, "CUSTO MAO DE OBRA")),
            "custo_material": br_to_float(val(row, "CUSTO MATERIAL")),
            "custo_equipamento": br_to_float(val(row, "CUSTO EQUIPAMENTO")),
        })

    # Deduplicar por codigo (mantendo a primeira ocorrencia)
    vistos = set()
    unicos = []
    for c in composicoes:
        if c["codigo"] not in vistos:
            vistos.add(c["codigo"])
            unicos.append(c)
    return unicos


def gerar_csv(composicoes, caminho_saida, referencia):
    os.makedirs(os.path.dirname(caminho_saida), exist_ok=True)
    with open(caminho_saida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["codigo", "descricao", "unidade", "classe", "grupo",
                    "custo_total", "custo_mao_obra", "custo_material",
                    "custo_equipamento", "referencia"])
        for c in sorted(composicoes, key=lambda x: x["codigo"]):
            w.writerow([
                c["codigo"], c["descricao"], c["unidade"], c["classe"], c["grupo"],
                f"{c['custo_total']:.2f}" if c["custo_total"] is not None else "",
                f"{c['custo_mao_obra']:.2f}" if c["custo_mao_obra"] is not None else "",
                f"{c['custo_material']:.2f}" if c["custo_material"] is not None else "",
                f"{c['custo_equipamento']:.2f}" if c["custo_equipamento"] is not None else "",
                referencia,
            ])


def atualizar_md_resumo(caminho_md, total, referencia):
    """Atualiza apenas o frontmatter e a linha de rodape do .md de referencia, sem tocar no resto."""
    if not os.path.exists(caminho_md):
        return
    with open(caminho_md, "r", encoding="utf-8") as f:
        txt = f.read()
    txt = re.sub(r"total_composicoes:\s*\d+", f"total_composicoes: {total}", txt)
    txt = re.sub(r"referencia:\s*\".*?\"", f'referencia: "{referencia}"', txt)
    txt = re.sub(
        r"\*Total:\s*[\d\.]+\s*composições.*?\*",
        f"*Total: {total} composições consolidadas do SINAPI-MG {referencia}.*",
        txt,
    )
    txt = re.sub(
        r"\*\*Total:\*\*\s*[\d\.]+\s*composições",
        f"**Total:** {total} composições",
        txt,
    )
    txt = re.sub(
        r"\*Atualizado automaticamente.*?\*",
        f"*Atualizado automaticamente via script local em {datetime.now().strftime('%d/%m/%Y %H:%M')}.*",
        txt,
    )
    with open(caminho_md, "w", encoding="utf-8") as f:
        f.write(txt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", action="store_true", help="Gera o CSV (flag exigida pelo workflow)")
    ap.add_argument("--dir", default="dados-brutos", help="Diretorio com os XLSX brutos")
    ap.add_argument("--out", default="vault/Recursos/sinapi_mg_industrial.csv", help="Caminho do CSV de saida")
    ap.add_argument("--md", default="vault/Recursos/SINAPI-MG-Industrial.md", help="Markdown de referencia a atualizar")
    args = ap.parse_args()

    analitico = achar_arquivo(args.dir, "SINAPI_Custo_Ref_Composicoes_Analitico_MG_*_NaoDesonerado.xlsx")
    if not analitico:
        print(f"[ERRO] Nenhum XLSX Analitico encontrado em {args.dir}/. "
              f"Suba o arquivo mensal da CEF antes de rodar.", file=sys.stderr)
        sys.exit(1)

    referencia = extrair_referencia(analitico)
    print(f"Processando: {analitico} (referencia {referencia})")

    composicoes = parse_analitico(analitico)
    print(f"Composicoes extraidas: {len(composicoes)}")

    gerar_csv(composicoes, args.out, referencia)
    print(f"CSV gerado: {args.out}")

    atualizar_md_resumo(args.md, len(composicoes), referencia)
    print(f"Markdown atualizado: {args.md}")


if __name__ == "__main__":
    main()
