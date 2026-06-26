#!/usr/bin/env python3
"""
sync_sheets_to_obsidian.py
Monitora Google Sheets e sincroniza entradas novas como arquivos .md no vault Obsidian via GitHub.

Uso:
    GITHUB_PAT=<token> SHEETS_ID=<id> python scripts/sync_sheets_to_obsidian.py

Dependências:
    pip install requests

Configuração Google Sheets:
    A planilha deve estar compartilhada como "qualquer pessoa com o link pode ver".
    Acesse a planilha → Compartilhar → Alterar para "Qualquer pessoa com o link" (Visualizador).
"""

import os
import re
import json
import time
import base64
import unicodedata
import requests
from datetime import datetime

# ── Configurações ──────────────────────────────────────────────────────────────
GITHUB_PAT   = os.environ["GITHUB_PAT"]  # export GITHUB_PAT=ghp_...
GITHUB_REPO  = "jonacir2023/jc"
GITHUB_BRANCH = "main"
SHEETS_ID    = os.getenv("SHEETS_ID", "18w5MaxMaC3ZbUwEHrfywlskht77MeguE")
INTERVAL     = 60  # segundos entre verificações

# Arquivo local que rastreia quais linhas já foram sincronizadas
STATE_FILE = os.path.join(os.path.dirname(__file__), ".sync_state.json")

GITHUB_API = "https://api.github.com"
SHEETS_API = f"https://sheets.googleapis.com/v4/spreadsheets/{SHEETS_ID}/values"

# ── Helpers ────────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    """Converte texto para kebab-case sem acentos."""
    text = unicodedata.normalize("NFKD", str(text))
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[\s_]+", "-", text)
    return text


def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {}


def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def sheets_get(range_name: str) -> list[list]:
    """Lê um intervalo da planilha (requer planilha pública ou API key)."""
    url = f"{SHEETS_API}/{requests.utils.quote(range_name)}"
    params = {"key": os.getenv("GOOGLE_API_KEY", "")}
    # Se não há API key, tenta acesso público (sem autenticação)
    resp = requests.get(url, params=params if params["key"] else {})
    if resp.status_code == 200:
        return resp.json().get("values", [])
    # Fallback: exportar como CSV
    csv_url = f"https://docs.google.com/spreadsheets/d/{SHEETS_ID}/gviz/tq?tqx=out:csv&sheet={requests.utils.quote(range_name)}"
    resp = requests.get(csv_url)
    if resp.status_code != 200:
        print(f"[ERRO] Não foi possível ler a aba '{range_name}': {resp.status_code}")
        return []
    rows = []
    import csv, io
    reader = csv.reader(io.StringIO(resp.text))
    for row in reader:
        rows.append(row)
    return rows


def github_get_file(path: str) -> tuple[str | None, str | None]:
    """Retorna (conteúdo, sha) de um arquivo no GitHub, ou (None, None) se não existe."""
    url = f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
    resp = requests.get(url, headers=headers, params={"ref": GITHUB_BRANCH})
    if resp.status_code == 200:
        data = resp.json()
        content = base64.b64decode(data["content"]).decode("utf-8")
        return content, data["sha"]
    return None, None


def github_put_file(path: str, content: str, message: str, sha: str | None = None):
    """Cria ou atualiza um arquivo no GitHub."""
    url = f"{GITHUB_API}/repos/{GITHUB_REPO}/contents/{path}"
    headers = {"Authorization": f"Bearer {GITHUB_PAT}", "Accept": "application/vnd.github+json"}
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
        print(f"  ❌ {path} — {resp.status_code}: {resp.text[:200]}")


# ── Geradores de Markdown ──────────────────────────────────────────────────────

def make_diario_md(row: list, headers: list) -> tuple[str, str, str]:
    """Gera (path, filename, conteúdo md) para uma linha do Diário de Obras."""
    def get(col):
        try:
            idx = headers.index(col)
            return row[idx] if idx < len(row) else ""
        except ValueError:
            return ""

    data         = get("Data") or datetime.now().strftime("%Y-%m-%d")
    setor        = get("Setor") or "Geral"
    descricao    = get("Descrição das Atividades") or ""
    responsavel  = get("Responsável") or ""
    clima        = get("Clima") or ""
    efetivo      = get("Efetivo (pessoas)") or "0"
    ocorrencias  = get("Ocorrências") or ""

    obra_slug = slugify(setor)
    filename  = f"DIARIO-{data}-{obra_slug}.md"
    path      = f"vault/Diário/{filename}"

    conteudo = f"""---
data: "{data}"
setor: "{setor}"
responsavel: "{responsavel}"
clima: "{clima}"
efetivo: {efetivo}
status: "Aberto"
criado_em: "{datetime.now().isoformat()}"
tags: [diário, obras]
---

# Diário de Obras — {data}

**Setor:** {setor}
**Responsável:** {responsavel}
**Clima:** {clima}
**Efetivo:** {efetivo} pessoas

## Atividades

{descricao}

## Ocorrências

{ocorrencias or "Nenhuma"}

## Histórico

- {datetime.now().strftime("%d/%m/%Y, %H:%M:%S")} — Criado via sincronização automática
"""
    commit_msg = f"diário: adiciona {setor} ({data})"
    return path, commit_msg, conteudo


def make_tarefa_md(row: list, headers: list, tipo: str = "Tarefa") -> tuple[str, str, str]:
    """Gera (path, commit_msg, conteúdo md) para Tarefa/Checkin/Pauta."""
    def get(col):
        try:
            idx = headers.index(col)
            return row[idx] if idx < len(row) else ""
        except ValueError:
            return ""

    tid         = get("ID") or get("Id") or "000"
    assunto     = get("Assunto") or get("Título") or "Sem título"
    descricao   = get("Descrição") or ""
    criador     = get("Criador") or ""
    responsavel = get("Responsável") or ""
    setor       = get("Setor") or ""
    prioridade  = get("Prioridade") or "Média"
    data_lanc   = get("Data") or datetime.now().strftime("%Y-%m-%d")
    previsao    = get("Previsão") or ""
    status      = get("Status") or "Aberta"

    tipo_upper = tipo.upper()
    tipo_lower = tipo.lower()
    assunto_slug = slugify(assunto)
    filename = f"{tipo_upper}-{tid}-{assunto_slug}.md"
    path = f"vault/Tarefas/{filename}"

    conteudo = f"""---
id: "{tid}"
tipo: "{tipo}"
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
tags: [{tipo_lower}, {setor.lower()}, {prioridade.lower()}]
---

# {assunto}

**Tipo:** {tipo}
**Responsável:** {responsavel}
**Setor:** {setor}
**Prioridade:** {prioridade}
**Status:** {status}

## Descrição

{descricao or "—"}

## Histórico

- {datetime.now().strftime("%d/%m/%Y, %H:%M:%S")} — Status inicial: "{status}"
"""
    commit_msg = f"{tipo_lower}: adiciona {assunto} ({tid})"
    return path, commit_msg, conteudo


# ── Sincronizadores por aba ────────────────────────────────────────────────────

def sync_diario(state: dict) -> dict:
    print("[Diário de Obras] Verificando...")
    rows = sheets_get("Diário de Obras")
    if len(rows) < 2:
        print("  Nenhuma entrada encontrada.")
        return state

    headers = rows[0]
    last_synced = state.get("diario_last_row", 1)
    new_rows = rows[last_synced:]  # linhas após o cabeçalho + já sincronizadas

    for i, row in enumerate(new_rows):
        if not any(row):  # linha vazia
            continue
        path, commit_msg, content = make_diario_md(row, headers)
        _, sha = github_get_file(path)
        github_put_file(path, content, commit_msg, sha)

    state["diario_last_row"] = len(rows)
    return state


def sync_tarefas(state: dict, aba: str, tipo: str) -> dict:
    print(f"[{aba}] Verificando...")
    rows = sheets_get(aba)
    if len(rows) < 2:
        print("  Nenhuma entrada encontrada.")
        return state

    headers = rows[0]
    key = f"{aba.lower()}_last_row"
    last_synced = state.get(key, 1)
    new_rows = rows[last_synced:]

    for row in new_rows:
        if not any(row):
            continue
        path, commit_msg, content = make_tarefa_md(row, headers, tipo)
        _, sha = github_get_file(path)
        github_put_file(path, content, commit_msg, sha)

    state[key] = len(rows)
    return state


# ── Loop principal ─────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🔄 Sincronização Google Sheets → Obsidian")
    print(f"   Planilha: {SHEETS_ID}")
    print(f"   Repositório: {GITHUB_REPO}")
    print(f"   Intervalo: {INTERVAL}s")
    print("=" * 60)

    while True:
        try:
            state = load_state()
            state = sync_diario(state)
            # Descomente quando houver abas Pauta/Checkin na planilha:
            # state = sync_tarefas(state, "Pauta", "Pauta")
            # state = sync_tarefas(state, "Checkin", "Checkin")
            save_state(state)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Próxima verificação em {INTERVAL}s...\n")
        except KeyboardInterrupt:
            print("\n⛔ Sincronização encerrada pelo usuário.")
            break
        except Exception as e:
            print(f"[ERRO] {e}")
        time.sleep(INTERVAL)


if __name__ == "__main__":
    main()
