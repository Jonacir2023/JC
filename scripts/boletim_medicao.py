#!/usr/bin/env python3
"""
boletim_medicao.py
Gera Boletim de Medição mensal consolidado a partir do Google Sheets
e salva como .md no vault Obsidian via GitHub API.

Abas necessárias na planilha:
  - EAP       : [pacote, valor_planejado, data_inicio, data_fim, contrato]
  - Medições  : [data, pacote, avanço_fisico (%), custo_real, medicao]

Uso:
    export GITHUB_PAT=ghp_...
    python scripts/boletim_medicao.py [--mes YYYY-MM]
"""

import os, csv, io, base64, requests, argparse
from datetime import datetime, date
from collections import defaultdict

GITHUB_PAT    = os.environ["GITHUB_PAT"]
GITHUB_REPO   = "jonacir2023/jc"
GITHUB_BRANCH = "main"
SHEETS_ID     = os.getenv("SHEETS_ID", "19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM")
GITHUB_API    = "https://api.github.com"


def sheets_csv(sheet_name):
    url = (f"https://docs.google.com/spreadsheets/d/{SHEETS_ID}"
           f"/gviz/tq?tqx=out:csv&sheet={requests.utils.quote(sheet_name)}")
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        print(f"  [ERRO] Aba '{sheet_name}': HTTP {resp.status_code}")
        return []
    return list(csv.reader(io.StringIO(resp.text)))


def github_put(path, content, message):
    url = f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
    resp = requests.get(url, headers=headers, params={"ref": GITHUB_BRANCH})
    sha = resp.json().get("sha") if resp.status_code == 200 else None
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha
    resp = requests.put(url, headers=headers, json=payload)
    print(f"  {'✅' if resp.status_code in (200,201) else '❌'} {path}")


def parse_float(v):
    try:
        return float(str(v).replace(",", ".").replace("%", "").strip())
    except:
        return 0.0


def gerar_boletim(mes_ref):
    """mes_ref: YYYY-MM, ex: 2026-06"""
    ano, mes = mes_ref.split("-")
    mes_label = datetime.strptime(mes_ref, "%Y-%m").strftime("%B/%Y")

    eap_rows = sheets_csv("EAP")
    if len(eap_rows) < 2:
        print("Aba EAP sem dados.")
        return None
    eap_headers = [h.strip().lower() for h in eap_rows[0]]
    eap = {}
    for row in eap_rows[1:]:
        if not any(c.strip() for c in row):
            continue
        d = dict(zip(eap_headers, row))
        nome = d.get("pacote", d.get("nome", ""))
        eap[nome] = d

    med_rows = sheets_csv("Medições")
    if len(med_rows) < 2:
        print("Aba Medições sem dados.")
        return None
    med_headers = [h.strip().lower() for h in med_rows[0]]

    # Separa medições do mês de referência vs acumulado anterior
    med_mes = defaultdict(lambda: {"custo": 0.0, "avanco": 0.0})
    med_ant = defaultdict(lambda: {"custo": 0.0, "avanco": 0.0})

    for row in med_rows[1:]:
        if not any(c.strip() for c in row):
            continue
        d = dict(zip(med_headers, row))
        data_str = d.get("data", "")
        pacote   = d.get("pacote", "")
        avanco   = parse_float(d.get("avanço_fisico", d.get("avanco", 0)))
        custo    = parse_float(d.get("custo_real", d.get("custo", 0)))
        # Tenta parsear data no formato YYYY-MM-DD ou DD/MM/YYYY
        try:
            if "/" in data_str:
                dt = datetime.strptime(data_str, "%d/%m/%Y")
            else:
                dt = datetime.strptime(data_str[:10], "%Y-%m-%d")
            row_mes = dt.strftime("%Y-%m")
        except Exception:
            row_mes = ""

        if row_mes == mes_ref:
            med_mes[pacote]["custo"] += custo
            med_mes[pacote]["avanco"] = max(med_mes[pacote]["avanco"], avanco)
        elif row_mes < mes_ref:
            med_ant[pacote]["custo"] += custo
            med_ant[pacote]["avanco"] = max(med_ant[pacote]["avanco"], avanco)

    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    linhas = []
    total_contrato = 0.0
    total_ant = 0.0
    total_mes = 0.0
    total_acum = 0.0

    for nome, dados in eap.items():
        vp = parse_float(dados.get("valor_planejado", dados.get("vp", 0)))
        contrato = parse_float(dados.get("contrato", vp))  # fallback: VP = contrato
        custo_ant = med_ant[nome]["custo"]
        custo_mes = med_mes[nome]["custo"]
        custo_acum = custo_ant + custo_mes
        avanco_mes = med_mes[nome]["avanco"]
        avanco_acum = max(med_ant[nome]["avanco"], avanco_mes)
        saldo = contrato - custo_acum
        perc_acum = round(custo_acum / contrato * 100, 1) if contrato > 0 else 0

        total_contrato += contrato
        total_ant      += custo_ant
        total_mes      += custo_mes
        total_acum     += custo_acum

        linhas.append({
            "pacote": nome,
            "contrato": contrato,
            "ant": custo_ant,
            "mes": custo_mes,
            "acum": custo_acum,
            "saldo": saldo,
            "avanco_mes": avanco_mes,
            "avanco_acum": avanco_acum,
            "perc": perc_acum,
        })

    total_saldo = total_contrato - total_acum
    perc_total = round(total_acum / total_contrato * 100, 1) if total_contrato > 0 else 0

    md = f"""---
tipo: "Boletim de Medição"
mes_referencia: "{mes_ref}"
data_emissao: "{date.today().isoformat()}"
valor_contrato: {total_contrato:.2f}
medido_mes: {total_mes:.2f}
acumulado: {total_acum:.2f}
saldo: {total_saldo:.2f}
tags: [boletim, medicao, obra]
---

# 📋 Boletim de Medição — {mes_label}

**Emitido em:** {now}

## Resumo Financeiro

| Item | Valor (R$) |
|------|------------|
| Valor do Contrato | {total_contrato:,.2f} |
| Medido Anterior | {total_ant:,.2f} |
| **Medido neste Mês** | **{total_mes:,.2f}** |
| Acumulado | {total_acum:,.2f} |
| Saldo a Medir | {total_saldo:,.2f} |
| % Executado | {perc_total:.1f}% |

---

## Medição por Pacote de Obra

| Pacote | Contrato (R$) | Anterior (R$) | Este Mês (R$) | Acumulado (R$) | Saldo (R$) | Avanço | % Acum |
|--------|--------------|--------------|--------------|----------------|-----------|--------|--------|
"""
    for ln in linhas:
        md += (f"| {ln['pacote']} "
               f"| {ln['contrato']:,.0f} "
               f"| {ln['ant']:,.0f} "
               f"| {ln['mes']:,.0f} "
               f"| {ln['acum']:,.0f} "
               f"| {ln['saldo']:,.0f} "
               f"| {ln['avanco_mes']:.0f}% "
               f"| {ln['perc']:.1f}% |\n")

    md += f"| **TOTAL** | **{total_contrato:,.0f}** | **{total_ant:,.0f}** | **{total_mes:,.0f}** | **{total_acum:,.0f}** | **{total_saldo:,.0f}** | — | **{perc_total:.1f}%** |\n"

    md += f"""
---

*Gerado automaticamente via GitHub Actions.*
"""
    return md, mes_ref


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mes", default=date.today().strftime("%Y-%m"),
                        help="Mês de referência YYYY-MM (padrão: mês atual)")
    args = parser.parse_args()

    print(f"Gerando Boletim de Medição — {args.mes}...")
    resultado = gerar_boletim(args.mes)
    if not resultado:
        print("Sem dados suficientes.")
        return
    md, mes_ref = resultado
    path = f"vault/Projetos/BOLETIM-{mes_ref}.md"
    github_put(path, md, f"boletim: medição de {mes_ref}")
    print("✅ Boletim de Medição gerado!")


if __name__ == "__main__":
    main()
