#!/usr/bin/env python3
"""
evm_dashboard.py
Calcula indicadores EVM (SPI, CPI, EAC) a partir do Google Sheets
e salva relatório .md no vault Obsidian via GitHub API.

Abas necessárias na planilha:
  - EAP       : colunas [pacote, valor_planejado, data_inicio, data_fim]
  - Medições  : colunas [data, pacote, avanço_fisico (%), custo_real]

Uso:
    export GITHUB_PAT=ghp_...
    python scripts/evm_dashboard.py
"""

import os, csv, io, json, base64, requests
from datetime import datetime, date

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


def calcular_evm():
    hoje = date.today()

    eap_rows = sheets_csv("EAP")
    if len(eap_rows) < 2:
        print("Aba EAP sem dados.")
        return None
    eap_headers = [h.strip().lower() for h in eap_rows[0]]
    eap = []
    for row in eap_rows[1:]:
        if not any(c.strip() for c in row):
            continue
        d = dict(zip(eap_headers, row))
        eap.append(d)

    med_rows = sheets_csv("Medições")
    med_headers = [h.strip().lower() for h in med_rows[0]] if len(med_rows) > 1 else []
    medicoes = []
    for row in med_rows[1:]:
        if not any(c.strip() for c in row):
            continue
        medicoes.append(dict(zip(med_headers, row)))

    bac = sum(parse_float(p.get("valor_planejado", p.get("vp", 0))) for p in eap)

    pacotes_med = {}
    for m in medicoes:
        pacote = m.get("pacote", "")
        avanco = parse_float(m.get("avanço_fisico", m.get("avanco", m.get("avanço", 0))))
        custo  = parse_float(m.get("custo_real", m.get("custo", 0)))
        if pacote not in pacotes_med:
            pacotes_med[pacote] = {"avanco": avanco, "custo_real": custo}
        else:
            pacotes_med[pacote]["avanco"] = max(pacotes_med[pacote]["avanco"], avanco)
            pacotes_med[pacote]["custo_real"] += custo

    ev_total = 0.0
    ac_total = 0.0
    linhas_pacotes = []

    for p in eap:
        nome   = p.get("pacote", p.get("nome", "?"))
        vp_pkg = parse_float(p.get("valor_planejado", p.get("vp", 0)))
        med    = pacotes_med.get(nome, {})
        avanco = med.get("avanco", 0.0) / 100.0
        custo  = med.get("custo_real", 0.0)
        ev_pkg = vp_pkg * avanco
        ev_total += ev_pkg
        ac_total += custo
        spi_pkg = round(ev_pkg / vp_pkg, 2) if vp_pkg > 0 else 0
        cpi_pkg = round(ev_pkg / custo, 2) if custo > 0 else 0
        linhas_pacotes.append({
            "pacote": nome,
            "vp": vp_pkg,
            "ev": ev_pkg,
            "ac": custo,
            "avanco": avanco * 100,
            "spi": spi_pkg,
            "cpi": cpi_pkg,
        })

    spi = round(ev_total / (bac * 0.5), 2) if bac > 0 else 0  # PV estimado = 50% BAC
    cpi = round(ev_total / ac_total, 2) if ac_total > 0 else 0
    eac = round(bac / cpi, 2) if cpi > 0 else bac
    var_custo  = round(ev_total - ac_total, 2)
    var_prazo  = round(ev_total - bac * 0.5, 2)

    def emoji_spi(v):
        if v >= 1.0: return "🟢"
        if v >= 0.8: return "🟡"
        return "🔴"

    now = datetime.now().strftime("%d/%m/%Y %H:%M")
    data_ref = hoje.strftime("%Y-%m-%d")

    md = f"""---
tipo: "Dashboard"
assunto: "EVM — Earned Value Management"
data: "{data_ref}"
bac: {bac:.2f}
ev: {ev_total:.2f}
ac: {ac_total:.2f}
spi: {spi}
cpi: {cpi}
eac: {eac:.2f}
tags: [evm, indicadores, planejamento]
---

# 📊 Dashboard EVM — {hoje.strftime("%B/%Y")}

**Atualizado:** {now} | **Referência:** {data_ref}

## Indicadores Globais

| Indicador | Valor | Status |
|-----------|-------|--------|
| **BAC** (Orçamento total) | R$ {bac:,.2f} | — |
| **EV** (Valor Agregado) | R$ {ev_total:,.2f} | — |
| **AC** (Custo Real) | R$ {ac_total:,.2f} | — |
| **SPI** (Desempenho Prazo) | {spi} | {emoji_spi(spi)} |
| **CPI** (Desempenho Custo) | {cpi} | {emoji_spi(cpi)} |
| **EAC** (Estimativa Final) | R$ {eac:,.2f} | — |
| **Variação Custo** | R$ {var_custo:,.2f} | {'🟢' if var_custo >= 0 else '🔴'} |
| **Variação Prazo** | R$ {var_prazo:,.2f} | {'🟢' if var_prazo >= 0 else '🔴'} |

> SPI ≥ 1.0 🟢 no prazo | SPI 0.8–1.0 🟡 atenção | SPI < 0.8 🔴 atrasado

---

## Desempenho por Pacote

| Pacote | VP (R$) | EV (R$) | AC (R$) | Avanço | SPI | CPI |
|--------|---------|---------|---------|--------|-----|-----|
"""
    for p in linhas_pacotes:
        md += (f"| {p['pacote']} | {p['vp']:,.0f} | {p['ev']:,.0f} | "
               f"{p['ac']:,.0f} | {p['avanco']:.0f}% | "
               f"{emoji_spi(p['spi'])} {p['spi']} | {emoji_spi(p['cpi'])} {p['cpi']} |\n")

    md += f"""
---

## Interpretação

- **CPI > 1** → custo abaixo do planejado ✅
- **CPI < 1** → custo acima do planejado ⚠️
- **SPI > 1** → adiantado no cronograma ✅
- **SPI < 1** → atrasado no cronograma ⚠️

*Gerado automaticamente via GitHub Actions.*
"""
    return md, data_ref


def main():
    print("Calculando EVM...")
    resultado = calcular_evm()
    if not resultado:
        print("Sem dados suficientes para calcular EVM.")
        return
    md, data_ref = resultado
    path = f"vault/Projetos/EVM-{data_ref}.md"
    github_put(path, md, f"evm: atualiza dashboard {data_ref}")
    print("✅ EVM Dashboard gerado!")


if __name__ == "__main__":
    main()
