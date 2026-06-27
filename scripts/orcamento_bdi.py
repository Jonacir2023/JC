#!/usr/bin/env python3
"""
orcamento_bdi.py
Gera Orçamento com BDI a partir do Google Sheets (aba Orçamento)
e salva como .md no vault Obsidian via GitHub API.

Aba necessária na planilha:
  - Orçamento : [item, descricao, unidade, quantidade, custo_unitario, bdi (%)]

Fórmula BDI aplicada:
  Preço Unitário = Custo Unitário × (1 + BDI/100)
  Preço Total = Preço Unitário × Quantidade

Uso:
    export GITHUB_PAT=ghp_...
    python scripts/orcamento_bdi.py [--obra "Nome da Obra"] [--bdi 25.0]
"""

import os, csv, io, base64, requests, argparse
from datetime import datetime, date

GITHUB_PAT    = os.environ["GITHUB_PAT"]
GITHUB_REPO   = "jonacir2023/jc"
GITHUB_BRANCH = "main"
SHEETS_ID     = os.getenv("SHEETS_ID", "19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM")
GITHUB_API    = "https://api.github.com"

# BDI padrão para obras industriais (TCU recomenda 24,86% para obras de edificação)
BDI_PADRAO = 25.0

# Composição típica do BDI
BDI_COMPOSICAO = {
    "Administração Central (AC)": 4.0,
    "Seguros e Garantias (S+G)": 0.8,
    "Riscos (R)": 0.97,
    "Despesas Financeiras (DF)": 1.23,
    "Lucro (L)": 7.3,
    "Tributos — PIS/COFINS/ISS (T)": 3.65,
}


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
        return float(str(v).replace(",", ".").replace("%", "").replace("R$", "").strip())
    except:
        return 0.0


def gerar_orcamento(nome_obra, bdi_global):
    orca_rows = sheets_csv("Orçamento")
    if len(orca_rows) < 2:
        print("Aba Orçamento sem dados.")
        return None

    headers = [h.strip().lower() for h in orca_rows[0]]

    def g(row, *keys):
        for k in keys:
            for h in headers:
                if k in h:
                    try:
                        idx = headers.index(h)
                        return row[idx].strip() if idx < len(row) else ""
                    except ValueError:
                        pass
        return ""

    itens = []
    grupos = {}
    total_custo_direto = 0.0
    total_preco = 0.0

    for row in orca_rows[1:]:
        if not any(c.strip() for c in row):
            continue

        item       = g(row, "item")
        descricao  = g(row, "descricao", "descrição", "descr")
        unidade    = g(row, "unidade", "und", "un")
        qtd        = parse_float(g(row, "quantidade", "qtd", "quant"))
        custo_unit = parse_float(g(row, "custo_unit", "custo unit", "preco_unit", "sinapi"))
        bdi_item   = parse_float(g(row, "bdi")) or bdi_global
        grupo      = g(row, "grupo", "servico", "serviço", "etapa") or "Geral"

        preco_unit = custo_unit * (1 + bdi_item / 100)
        preco_total = preco_unit * qtd
        custo_total = custo_unit * qtd

        total_custo_direto += custo_total
        total_preco        += preco_total

        if grupo not in grupos:
            grupos[grupo] = {"custo": 0.0, "preco": 0.0}
        grupos[grupo]["custo"] += custo_total
        grupos[grupo]["preco"] += preco_total

        itens.append({
            "item": item,
            "descricao": descricao,
            "und": unidade,
            "qtd": qtd,
            "custo_unit": custo_unit,
            "bdi": bdi_item,
            "preco_unit": preco_unit,
            "preco_total": preco_total,
            "grupo": grupo,
        })

    bdi_valor = total_preco - total_custo_direto
    data_ref  = date.today().strftime("%Y-%m-%d")
    now       = datetime.now().strftime("%d/%m/%Y %H:%M")

    # Monta composição BDI
    bdi_comp_md = ""
    for comp, perc in BDI_COMPOSICAO.items():
        bdi_comp_md += f"| {comp} | {perc:.2f}% |\n"

    md = f"""---
tipo: "Orçamento"
obra: "{nome_obra}"
data: "{data_ref}"
bdi: {bdi_global:.2f}
custo_direto: {total_custo_direto:.2f}
bdi_valor: {bdi_valor:.2f}
preco_total: {total_preco:.2f}
tags: [orcamento, bdi, obra]
---

# 💰 Orçamento — {nome_obra}

**Emitido em:** {now} | **BDI Global:** {bdi_global:.2f}%

## Resumo

| Item | Valor (R$) |
|------|------------|
| Custo Direto (sem BDI) | {total_custo_direto:,.2f} |
| BDI ({bdi_global:.1f}%) | {bdi_valor:,.2f} |
| **Preço Total** | **{total_preco:,.2f}** |

---

## Composição do BDI

| Componente | % |
|------------|---|
{bdi_comp_md}
| **BDI Total** | **{bdi_global:.2f}%** |

> Referência: Acórdão TCU 2.622/2013 — obras de edificação

---

## Planilha Orçamentária

| Item | Descrição | Und | Qtd | Custo Unit. | BDI% | Preço Unit. | Preço Total |
|------|-----------|-----|-----|-------------|------|-------------|-------------|
"""

    grupo_atual = None
    for it in itens:
        if it["grupo"] != grupo_atual:
            grupo_atual = it["grupo"]
            md += f"| **{grupo_atual}** | | | | | | | |\n"
        md += (f"| {it['item']} | {it['descricao']} | {it['und']} "
               f"| {it['qtd']:,.2f} | {it['custo_unit']:,.2f} "
               f"| {it['bdi']:.1f}% | {it['preco_unit']:,.2f} "
               f"| {it['preco_total']:,.2f} |\n")

    md += f"| | **TOTAL** | | | | | | **{total_preco:,.2f}** |\n"

    md += """
---

## Resumo por Grupo

| Grupo | Custo Direto (R$) | Preço c/ BDI (R$) | % do Total |
|-------|------------------|-------------------|------------|
"""
    for grp, vals in grupos.items():
        perc = round(vals["preco"] / total_preco * 100, 1) if total_preco > 0 else 0
        md += f"| {grp} | {vals['custo']:,.0f} | {vals['preco']:,.0f} | {perc:.1f}% |\n"

    md += f"""
---

*Gerado automaticamente via GitHub Actions — SINAPI MG Não Desonerado.*
"""
    return md, data_ref


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--obra", default="Obra", help="Nome da obra")
    parser.add_argument("--bdi", type=float, default=BDI_PADRAO,
                        help=f"BDI global em %% (padrão: {BDI_PADRAO})")
    args = parser.parse_args()

    print(f"Gerando Orçamento com BDI {args.bdi}%...")
    resultado = gerar_orcamento(args.obra, args.bdi)
    if not resultado:
        print("Sem dados suficientes.")
        return
    import re
    slug = re.sub(r"[^\w]", "-", args.obra.lower())[:30]
    md, data_ref = resultado
    path = f"vault/Projetos/ORCAMENTO-{data_ref}-{slug}.md"
    github_put(path, md, f"orçamento: {args.obra} ({data_ref})")
    print("✅ Orçamento com BDI gerado!")


if __name__ == "__main__":
    main()
