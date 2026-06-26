#!/usr/bin/env python3
"""
sync_sheets_to_obsidian.py
Monitora Google Sheets (planilha real do JC) e sincroniza entradas novas
como arquivos .md no vault Obsidian via GitHub API.

Uso:
    export GITHUB_PAT=ghp_...
    python scripts/sync_sheets_to_obsidian.py

Dependências:
    pip install requests

Pré-requisito Google Sheets:
    Compartilhar planilha como "Qualquer pessoa com o link pode ver".
"""

import os
import re
import csv
import io
import json
import time
import base64
import unicodedata
import requests
from datetime import datetime

# ── Configurações ──────────────────────────────────────────────────────────────
GITHUB_PAT    = os.environ["GITHUB_PAT"]
GITHUB_REPO   = "jonacir2023/jc"
GITHUB_BRANCH = "main"
SHEETS_ID     = os.getenv("SHEETS_ID", "19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM")
INTERVAL      = 60  # segundos

STATE_FILE = os.path.join(os.path.dirname(__file__), ".sync_state.json")
GITHUB_API = "https://api.github.com"

# ── Utilitários ────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[\s_]+", "-", text)


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}


def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def sheets_csv(sheet_name: str) -> list:
    """Exporta aba como CSV via URL pública."""
    url = (
        f"https://docs.google.com/spreadsheets/d/{SHEETS_ID}"
        f"/gviz/tq?tqx=out:csv&sheet={requests.utils.quote(sheet_name)}"
    )
    resp = requests.get(url, timeout=15)
    if resp.status_code != 200:
        print(f"  [ERRO] Aba '{sheet_name}': HTTP {resp.status_code}")
        return []
    reader = csv.reader(io.StringIO(resp.text))
    return list(reader)


def github_get_sha(path: str):
    url = f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
    resp = requests.get(url, headers=headers, params={"ref": GITHUB_BRANCH})
    if resp.status_code == 200:
        return resp.json().get("sha")
    return None


def github_put(path: str, content: str, message: str):
    url = f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
    sha = github_get_sha(path)
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("ascii"),
        "branch": GITHUB_BRANCH,
    }
    if sha:
        payload["sha"] = sha
    resp = requests.put(url, headers=headers, json=payload)
    if resp.status_code in (200, 201):
        print(f"  ✅ {path}")
    else:
        print(f"  ❌ {path} — {resp.status_code}: {resp.text[:300]}")


# ── Gerador: Diário de Obras ───────────────────────────────────────────────────

def make_diario_md(row, headers):
    def g(col):
        try:
            i = headers.index(col)
            return row[i].strip() if i < len(row) else ""
        except ValueError:
            return ""

    data       = g("Data") or datetime.now().strftime("%Y-%m-%d")
    dia_sem    = g("Dia da Semana")
    obra       = g("Obra") or "obra"
    empresa    = g("Empresa")
    cidade     = g("Cidade")
    local_     = g("Local")
    descricao  = g("Descrição")
    clima      = g("Tempo / Clima")
    jornada    = g("Jornada")
    dss_hora   = g("DSS — Horário")
    dss_min    = g("DSS — Ministrado Por")
    dss_tema   = g("DSS — Tema")
    atividades = g("Atividades do Dia")
    ef_total   = g("Efetivo Total")
    ef_funcao  = g("Efetivo por Função")
    colabor    = g("Colaboradores Presentes")
    equip      = g("Equipamentos Utilizados")
    veiculos   = g("Veículos Leves")
    parados    = g("Equipamentos e Veiculos parados")
    ev_seg     = g("Eventos de Segurança")
    ev_meio    = g("Eventos de Meio Ambiente")
    obs        = g("Observações do Dia")
    apontador  = g("Apontador")

    slug = f"{data}-{slugify(obra or 'obra')}"
    path = f"vault/Diário/DIARIO-{slug}.md"
    now  = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")

    md = f"""---
data: "{data}"
dia_semana: "{dia_sem}"
obra: "{obra}"
empresa: "{empresa}"
cidade: "{cidade}"
local: "{local_}"
clima: "{clima}"
efetivo_total: "{ef_total}"
apontador: "{apontador}"
status: "Aberto"
criado_em: "{datetime.now().isoformat()}"
tags: [diário, obras]
---

# Diário de Obras — {data} ({dia_sem})

**Obra:** {obra} | **Empresa:** {empresa}
**Cidade:** {cidade} | **Local:** {local_}
**Clima:** {clima}
**Jornada:** {jornada}

## DSS — Diálogo de Segurança

| Campo | Valor |
|---|---|
| Horário | {dss_hora} |
| Ministrado por | {dss_min} |
| Tema | {dss_tema} |

## Descrição do Dia

{descricao}

## Atividades do Dia

{atividades}

## Efetivo

**Total:** {ef_total} pessoas

**Por Função:**
{ef_funcao}

**Colaboradores Presentes:**
{colabor}

## Equipamentos e Veículos

**Equipamentos:** {equip}
**Veículos Leves:** {veiculos}
**Parados/Indisponíveis:** {parados}

## Eventos

**Segurança:** {ev_seg or "Nenhum"}
**Meio Ambiente:** {ev_meio or "Nenhum"}

## Observações

{obs or "—"}

**Apontador:** {apontador}

## Histórico

- {now} — Criado via sincronização automática
"""
    commit = f"diário: adiciona {obra} ({data})"
    return path, commit, md


# ── Gerador: Pauta ────────────────────────────────────────────────────────────

def make_pauta_md(row, headers):
    def g(col):
        try:
            i = headers.index(col)
            return row[i].strip() if i < len(row) else ""
        except ValueError:
            return ""

    tid         = g("id") or g("ID") or "000"
    assunto     = g("assunto") or g("Assunto") or "Sem título"
    descricao   = g("descrição") or g("Descrição") or ""
    criador     = g("criador") or g("Criador") or ""
    responsavel = g("responsável") or g("Responsável") or ""
    setor       = g("setor") or g("Setor") or ""
    prioridade  = g("prioridade") or g("Prioridade") or "Média"
    status      = g("status") or g("Status") or "Aberta"
    data_lanc   = g("data_lançamento") or g("Data de lançamento") or ""
    previsao    = g("data_término") or g("Previsão de Término") or ""

    slug = slugify(assunto)
    path = f"vault/Tarefas/PAUTA-{tid}-{slug}.md"
    now  = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")

    md = f"""---
id: "{tid}"
tipo: "Pauta"
assunto: "{assunto}"
descricao: "{descricao}"
criador: "{criador}"
responsavel: "{responsavel}"
setor: "{setor}"
prioridade: "{prioridade}"
data_lancamento: "{data_lanc}"
previsao_termino: "{previsao}"
status: "{status}"
criado_em: "{datetime.now().isoformat()}"
tags: [pauta, {setor.lower()}, {prioridade.lower()}]
---

# \U0001f4cb {assunto}

**Responsável:** {responsavel} | **Criador:** {criador}
**Setor:** {setor} | **Prioridade:** {prioridade}
**Status:** {status}
**Lançamento:** {data_lanc} | **Término Previsto:** {previsao}

## Descrição

{descricao or "—"}

## Histórico

- {now} — Status: "{status}"
"""
    commit = f"pauta: adiciona {assunto} ({tid})"
    return path, commit, md


# ── Gerador: Checkin ──────────────────────────────────────────────────────────

def make_checkin_md(row, headers):
    def g(col):
        try:
            i = headers.index(col)
            return row[i].strip() if i < len(row) else ""
        except ValueError:
            return ""

    tid         = g("id") or g("ID") or "000"
    data        = g("data") or g("Data") or datetime.now().strftime("%Y-%m-%d")
    hora        = g("hora") or g("Hora") or ""
    obra        = g("obra") or g("Obra") or ""
    resumo      = g("resumo") or g("Resumo") or ""
    pautas_json = g("assuntos_json") or g("Assuntos") or "[]"

    try:
        pautas = json.loads(pautas_json)
        pautas_md = "\n".join(
            f"- [{p.get('assunto','?')}] → {p.get('status','?')}"
            for p in pautas
        )
    except Exception:
        pautas_md = pautas_json

    slug = f"{data}-{slugify(obra or 'obra')}"
    path = f"vault/Tarefas/CHECKIN-{tid}-{slug}.md"
    now  = datetime.now().strftime("%d/%m/%Y, %H:%M:%S")

    md = f"""---
id: "{tid}"
tipo: "Checkin"
data: "{data}"
hora: "{hora}"
obra: "{obra}"
status: "Concluído"
criado_em: "{datetime.now().isoformat()}"
tags: [checkin, obras]
---

# ✅ Check-in — {data} {hora}

**Obra:** {obra}

## Resumo

{resumo or "—"}

## Pautas Discutidas

{pautas_md or "—"}

## Histórico

- {now} — Criado via sincronização automática
"""
    commit = f"checkin: adiciona {obra} ({data})"
    return path, commit, md


# ── Sincronizadores ────────────────────────────────────────────────────────────

def sync_sheet(state, sheet_name, state_key, make_fn):
    print(f"[{sheet_name}] Verificando...")
    rows = sheets_csv(sheet_name)
    if len(rows) < 2:
        print(f"  Sem dados em '{sheet_name}'.")
        return state

    headers = rows[0]
    last = state.get(state_key, 1)
    new_rows = rows[last:]

    count = 0
    for row in new_rows:
        if not any(c.strip() for c in row):
            continue
        try:
            path, commit, content = make_fn(row, headers)
            github_put(path, content, commit)
            count += 1
        except Exception as e:
            print(f"  [ERRO linha] {e}")

    print(f"  {count} entrada(s) sincronizada(s)." if count else "  Nenhuma entrada nova.")
    state[state_key] = len(rows)
    return state


# ── Loop principal ─────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("Sincronização Google Sheets → Obsidian")
    print(f"  Planilha : {SHEETS_ID}")
    print(f"  Repo     : {GITHUB_REPO} ({GITHUB_BRANCH})")
    print(f"  Intervalo: {INTERVAL}s")
    print("=" * 60)

    while True:
        try:
            state = load_state()
            state = sync_sheet(state, "Diário de Obras", "diario_last_row", make_diario_md)
            state = sync_sheet(state, "Pautas",          "pautas_last_row", make_pauta_md)
            state = sync_sheet(state, "Checkins",        "checkin_last_row", make_checkin_md)
            save_state(state)
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"[{ts}] Próxima verificação em {INTERVAL}s\n")
        except KeyboardInterrupt:
            print("\nSincronização encerrada.")
            break
        except Exception as e:
            print(f"[ERRO GERAL] {e}")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
