#!/usr/bin/env python3
"""
importar_sinapi_mg.py
Baixa as composições SINAPI-MG diretamente da Caixa Econômica Federal,
filtra composições relevantes para obras industriais e salva no Google Sheets.

Uso:
    pip install requests openpyxl gspread google-auth
    export GOOGLE_CREDS_JSON=/caminho/para/service-account.json
    python scripts/importar_sinapi_mg.py

    # Sem Google Sheets (só gera CSV local):
    python scripts/importar_sinapi_mg.py --csv

Fonte dos dados: SINAPI oficial - Caixa Econômica Federal (dados públicos)
"""

import os
import re
import csv
import sys
import json
import time
import zipfile
import argparse
import tempfile
import requests
from pathlib import Path
from datetime import datetime

# ── Configurações ──────────────────────────────────────────────────────────────

ESTADO       = "MG"
SHEETS_ID    = os.getenv("SHEETS_ID", "19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM")
ABA_SINAPI   = "SINAPI-MG"

# URL do sumário de publicações SINAPI (mantido pela comunidade)
SUMARIO_URL  = "https://cesarep.github.io/sumario-sinapi/"

# ── Palavras-chave para obras industriais ─────────────────────────────────────
# Filtra composições relevantes pelo campo "descrição"

FILTROS_INDUSTRIAIS = [
    # Fundações
    "estaca", "bloco de fundação", "sapata", "radier", "baldrame",
    "cortina de contenção", "estacão", "tubulão",
    # Estrutura de concreto
    "concreto estrutural", "concreto fck", "armação", "forma para", "fôrma",
    "viga", "pilar", "laje", "cálice", "reservatório",
    # Estrutura metálica
    "estrutura metálica", "perfil metálico", "chapa de aço", "soldagem",
    "parafuso", "galvanizado", "treliça", "galpão",
    # Pavimentação industrial
    "pavimento", "piso industrial", "concreto magro", "sub-base",
    "base de brita", "usinagem", "fresagem",
    # Cobertura industrial
    "telha", "cobertura metálica", "calha", "rufos", "impermeabilização",
    # Instalações industriais
    "subestação", "transformador", "quadro elétrico", "aterramento",
    "tubulação", "compressor", "ventilação industrial", "exaustão",
    # Terraplanagem
    "terraplenagem", "escavação", "aterro", "compactação", "motor scraper",
    "trator de lâmina", "escavadeira",
    # Drenagem
    "drenagem", "bueiro", "sarjeta", "canaleta", "manta geotêxtil",
    # Alvenaria e fechamento
    "alvenaria", "painel pré-moldado", "vedação",
]

# ── Helpers ────────────────────────────────────────────────────────────────────

def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def filtrar_industrial(descricao: str) -> bool:
    """Retorna True se a descrição contém algum termo de obras industriais."""
    desc = descricao.lower()
    return any(termo in desc for termo in FILTROS_INDUSTRIAIS)


# ── Download SINAPI da Caixa ───────────────────────────────────────────────────

def descobrir_url_sinapi_mg() -> str:
    """
    Tenta descobrir a URL do ZIP mais recente do SINAPI-MG.
    A Caixa usa um padrão de URL previsível.
    """
    # Padrão de URL da Caixa para composições analíticas (não desonerado)
    # Exemplo: SINAPI_ref_insu_comp_MG_202405_NDesonerado.zip
    agora = datetime.now()
    # Tenta o mês atual e os 2 anteriores (publicação pode atrasar)
    for delta in range(0, 3):
        mes = agora.month - delta
        ano = agora.year
        if mes <= 0:
            mes += 12
            ano -= 1
        ref = f"{ano}{mes:02d}"
        url = (
            f"https://www.caixa.gov.br/Downloads/sinapi-a-partir-jul-2009-{ESTADO.lower()}/"
            f"SINAPI_ref_insu_comp_{ESTADO}_{ref}_NDesonerado.zip"
        )
        log(f"Tentando: {url}")
        resp = requests.head(url, timeout=10, allow_redirects=True)
        if resp.status_code == 200:
            log(f"✅ Encontrado: {ref}")
            return url
    # Fallback: URL genérica da página de insumos
    return None


def baixar_sinapi_mg(destino: Path) -> Path | None:
    """Baixa o ZIP do SINAPI-MG e retorna o caminho do arquivo."""
    url = descobrir_url_sinapi_mg()
    if not url:
        log("❌ Não foi possível encontrar a URL do SINAPI-MG automaticamente.")
        log("   Acesse manualmente: https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/")
        log("   Baixe o ZIP de MG e coloque em: " + str(destino))
        return None

    log(f"Baixando SINAPI-MG (~20MB)...")
    zip_path = destino / "sinapi_mg.zip"
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        baixado = 0
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
                baixado += len(chunk)
                if total:
                    pct = baixado * 100 // total
                    print(f"\r  {pct}% ({baixado//1024}KB)", end="", flush=True)
    print()
    log(f"✅ Baixado: {zip_path}")
    return zip_path


def extrair_xlsx_composicoes(zip_path: Path, destino: Path) -> Path | None:
    """Extrai o arquivo de composições analíticas do ZIP."""
    with zipfile.ZipFile(zip_path) as z:
        nomes = z.namelist()
        log(f"Arquivos no ZIP: {nomes}")
        # Procura pelo arquivo de composições analíticas
        for nome in nomes:
            if ("comp" in nome.lower() or "composicao" in nome.lower()) and nome.endswith(".xlsx"):
                xlsx_path = destino / nome
                z.extract(nome, destino)
                log(f"✅ Extraído: {xlsx_path}")
                return xlsx_path
        # Se não achou por nome, pega o maior XLSX (geralmente é o analítico)
        xlsx_files = [n for n in nomes if n.endswith(".xlsx")]
        if xlsx_files:
            maior = max(xlsx_files, key=lambda n: z.getinfo(n).file_size)
            xlsx_path = destino / maior
            z.extract(maior, destino)
            log(f"✅ Extraído (maior): {xlsx_path}")
            return xlsx_path
    log("❌ Nenhum XLSX encontrado no ZIP.")
    return None


# ── Parser XLSX SINAPI ─────────────────────────────────────────────────────────

def parse_sinapi_xlsx(xlsx_path: Path) -> list:
    """
    Lê o Excel de composições SINAPI e retorna lista de dicts.
    A Caixa usa um formato com cabeçalho nas primeiras linhas — detectamos automaticamente.
    """
    try:
        import openpyxl
    except ImportError:
        log("❌ Instale openpyxl: pip install openpyxl")
        sys.exit(1)

    log(f"Lendo Excel: {xlsx_path}")
    wb = openpyxl.load_workbook(xlsx_path, read_only=True, data_only=True)
    ws = wb.active

    composicoes = []
    header = None
    header_row = None

    for i, row in enumerate(ws.iter_rows(values_only=True)):
        vals = [str(v).strip() if v is not None else "" for v in row]

        # Detecta linha de cabeçalho (contém "CÓDIGO" ou "DESCRIÇÃO")
        if header is None:
            if any("CÓDIGO" in v.upper() or "CODIGO" in v.upper() for v in vals):
                header = [v.upper() for v in vals]
                header_row = i
                log(f"Cabeçalho encontrado na linha {i+1}: {header[:6]}...")
                continue

        if header is None:
            continue

        if not any(vals):  # linha vazia
            continue

        row_dict = dict(zip(header, vals))

        # Campos principais do SINAPI
        codigo     = row_dict.get("CÓDIGO", row_dict.get("CODIGO", ""))
        descricao  = row_dict.get("DESCRIÇÃO", row_dict.get("DESCRICAO", ""))
        unidade    = row_dict.get("UNIDADE", row_dict.get("UN", ""))
        custo      = row_dict.get("CUSTO TOTAL", row_dict.get("CUSTO", row_dict.get("PREÇO TOTAL", "")))
        material   = row_dict.get("MATERIAL", row_dict.get("MATERIAIS", ""))
        mo         = row_dict.get("MÃO DE OBRA", row_dict.get("MAO DE OBRA", row_dict.get("M.O.", "")))
        equipament = row_dict.get("EQUIPAMENTO", row_dict.get("EQUIPAMENTOS", ""))

        if not codigo or not descricao:
            continue

        # Filtra apenas composições industriais
        if not filtrar_industrial(descricao):
            continue

        composicoes.append({
            "codigo":      codigo,
            "descricao":   descricao,
            "unidade":     unidade,
            "custo_total": custo,
            "material":    material,
            "mao_de_obra": mo,
            "equipamento": equipament,
            "estado":      ESTADO,
            "referencia":  datetime.now().strftime("%Y-%m"),
        })

    wb.close()
    log(f"✅ {len(composicoes)} composições industriais encontradas")
    return composicoes


# ── Saída: CSV local ───────────────────────────────────────────────────────────

def salvar_csv(composicoes: list, caminho: str = "sinapi_mg_industrial.csv"):
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        campos = ["codigo", "descricao", "unidade", "custo_total",
                  "material", "mao_de_obra", "equipamento", "estado", "referencia"]
        writer = csv.DictWriter(f, fieldnames=campos)
        writer.writeheader()
        writer.writerows(composicoes)
    log(f"✅ CSV salvo: {caminho} ({len(composicoes)} linhas)")


# ── Saída: Google Sheets ───────────────────────────────────────────────────────

def salvar_sheets(composicoes: list):
    """Envia as composições para a aba SINAPI-MG no Google Sheets."""
    creds_path = os.getenv("GOOGLE_CREDS_JSON")
    if not creds_path:
        log("❌ Configure GOOGLE_CREDS_JSON com o caminho do service account JSON")
        log("   (ou use --csv para salvar localmente)")
        return

    try:
        import gspread
        from google.oauth2.service_account import Credentials
    except ImportError:
        log("❌ Instale: pip install gspread google-auth")
        return

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds  = Credentials.from_service_account_file(creds_path, scopes=scopes)
    gc     = gspread.authorize(creds)
    sh     = gc.open_by_key(SHEETS_ID)

    # Cria ou limpa a aba SINAPI-MG
    try:
        ws = sh.worksheet(ABA_SINAPI)
        ws.clear()
        log(f"Aba '{ABA_SINAPI}' limpa.")
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=ABA_SINAPI, rows=5000, cols=10)
        log(f"Aba '{ABA_SINAPI}' criada.")

    # Cabeçalho
    header = ["Código", "Descrição", "Unidade", "Custo Total (R$)",
              "Material (R$)", "Mão de Obra (R$)", "Equipamento (R$)",
              "Estado", "Referência"]
    linhas = [header]
    for c in composicoes:
        linhas.append([
            c["codigo"], c["descricao"], c["unidade"], c["custo_total"],
            c["material"], c["mao_de_obra"], c["equipamento"],
            c["estado"], c["referencia"],
        ])

    # Envia em lotes de 500 (limite do Sheets API)
    for i in range(0, len(linhas), 500):
        ws.append_rows(linhas[i:i+500], value_input_option="USER_ENTERED")
        log(f"  Enviado lote {i//500 + 1}")
        time.sleep(1)  # evita rate limit

    log(f"✅ {len(composicoes)} composições enviadas para '{ABA_SINAPI}'")


# ── Principal ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Importa SINAPI-MG para Google Sheets ou CSV")
    parser.add_argument("--csv", action="store_true", help="Salva em CSV local ao invés do Sheets")
    parser.add_argument("--xlsx", help="Usa um XLSX local ao invés de baixar da Caixa")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        if args.xlsx:
            xlsx_path = Path(args.xlsx)
        else:
            zip_path = baixar_sinapi_mg(tmp)
            if not zip_path:
                log("Saindo. Forneça o ZIP manualmente com --xlsx <arquivo.xlsx>")
                sys.exit(1)
            xlsx_path = extrair_xlsx_composicoes(zip_path, tmp)
            if not xlsx_path:
                sys.exit(1)

        composicoes = parse_sinapi_xlsx(xlsx_path)

        if not composicoes:
            log("Nenhuma composição industrial encontrada. Verifique os filtros.")
            sys.exit(1)

        if args.csv:
            salvar_csv(composicoes)
        else:
            salvar_sheets(composicoes)

        log("Concluído!")


if __name__ == "__main__":
    main()
