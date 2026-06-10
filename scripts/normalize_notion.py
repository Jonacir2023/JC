#!/usr/bin/env python3
"""Normaliza notas importadas do Notion para o padrão de tarefas do vault JC.

Lê arquivos .md de uma pasta de staging (ex.: vault/Recursos/Importado-Notion),
mapeia o frontmatter exportado pelo Notion para o padrão JC e gera arquivos
TAREFA-{id}-{assunto-kebab}.md em vault/Tarefas/.

Uso:
    python scripts/normalize_notion.py vault/Recursos/Importado-Notion --dry-run
    python scripts/normalize_notion.py vault/Recursos/Importado-Notion
    python scripts/normalize_notion.py <pasta> --out vault/Tarefas --criador Jonacir

Apenas arquivos cujo frontmatter pareça uma tarefa (tem alguma propriedade
mapeável como Assunto/Prioridade/Status/Responsável) são convertidos; os
demais são listados como "ignorado" para triagem manual.
"""

import argparse
import datetime as dt
import re
import sys
import unicodedata
from pathlib import Path

SETORES = ["Suprimentos", "Transporte", "Planejamento", "Administração", "Segurança"]
PRIORIDADES = {"baixa": "Baixa", "média": "Média", "media": "Média", "alta": "Alta"}
STATUS = {
    "aberta": "Aberta", "aberto": "Aberta", "todo": "Aberta", "to do": "Aberta",
    "not started": "Aberta", "em andamento": "Em Andamento", "in progress": "Em Andamento",
    "doing": "Em Andamento", "concluído": "Concluído", "concluido": "Concluído",
    "done": "Concluído", "complete": "Concluído", "completed": "Concluído",
}
PRIORIDADE_EMOJI = {"Alta": "🔴", "Média": "🟡", "Baixa": "🟢"}

# nomes de propriedades do Notion -> campos JC (comparação sem acentos/caixa)
ALIASES = {
    "id": "id",
    "assunto": "assunto", "name": "assunto", "title": "assunto", "nome": "assunto",
    "descricao": "descricao", "descricao do assunto": "descricao",
    "description": "descricao", "notes": "descricao",
    "criador": "criador", "created by": "criador", "author": "criador",
    "responsavel": "responsavel", "assignee": "responsavel",
    "assigned to": "responsavel", "owner": "responsavel",
    "setor": "setor", "area": "setor", "department": "setor", "categoria": "setor",
    "prioridade": "prioridade", "priority": "prioridade",
    "data de lancamento": "data_lancamento", "data lancamento": "data_lancamento",
    "data_lancamento": "data_lancamento", "created": "data_lancamento",
    "created time": "data_lancamento", "start date": "data_lancamento",
    "previsao de termino": "previsao_termino", "previsao_termino": "previsao_termino",
    "due": "previsao_termino", "due date": "previsao_termino",
    "deadline": "previsao_termino", "prazo": "previsao_termino",
    "status": "status",
}


def strip_accents(text: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", text)
                   if unicodedata.category(c) != "Mn")


def kebab(text: str) -> str:
    text = strip_accents(text).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "sem-assunto"


def parse_frontmatter(content: str):
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", content, re.DOTALL)
    if not m:
        return {}, content
    fields = {}
    for line in m.group(1).splitlines():
        kv = re.match(r"^([^:#][^:]*):\s*(.*)$", line)
        if kv:
            fields[kv.group(1).strip()] = kv.group(2).strip().strip('"').strip("'")
    return fields, m.group(2)


def parse_date(value: str) -> str:
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%B %d, %Y", "%d %B %Y", "%Y-%m-%dT%H:%M"):
        try:
            return dt.datetime.strptime(value[:16].rstrip("TZ "), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    m = re.search(r"\d{4}-\d{2}-\d{2}", value)
    return m.group(0) if m else ""


def br_date(iso: str) -> str:
    try:
        return dt.datetime.strptime(iso, "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return iso


def map_fields(raw: dict) -> dict:
    mapped = {}
    for key, value in raw.items():
        alias = ALIASES.get(strip_accents(key).lower().strip())
        if alias and value:
            mapped.setdefault(alias, value)
    return mapped


def normalize(path: Path, out_dir: Path, criador_padrao: str, next_id: int, dry_run: bool):
    raw_fields, body = parse_frontmatter(path.read_text(encoding="utf-8"))
    fields = map_fields(raw_fields)

    # considera tarefa se tiver pelo menos um campo típico além do título
    if not any(k in fields for k in ("prioridade", "status", "responsavel", "previsao_termino", "setor")):
        return None

    assunto = fields.get("assunto") or path.stem
    task_id = fields.get("id") or str(next_id)
    prioridade = PRIORIDADES.get(strip_accents(fields.get("prioridade", "")).lower(), "Média")
    status = STATUS.get(fields.get("status", "").lower(), "Aberta")
    setor = next((s for s in SETORES
                  if strip_accents(s).lower() == strip_accents(fields.get("setor", "")).lower()),
                 "Administração")
    descricao = fields.get("descricao", "")
    criador = fields.get("criador", criador_padrao)
    responsavel = fields.get("responsavel", "")
    data_lancamento = parse_date(fields.get("data_lancamento", "")) or dt.date.today().isoformat()
    previsao = parse_date(fields.get("previsao_termino", ""))
    agora = dt.datetime.now()
    emoji = PRIORIDADE_EMOJI[prioridade]

    filename = f"TAREFA-{task_id}-{kebab(assunto)}.md"
    body = body.strip()
    descricao_md = descricao or body or "—"

    note = f"""---
id: "{task_id}"
tipo: "Tarefa"
assunto: "{assunto}"
descricao: "{descricao}"
criador: "{criador}"
responsavel: "{responsavel}"
setor: "{setor}"
prioridade: "{prioridade}"
data_lancamento: "{data_lancamento}"
previsao_termino: "{previsao}"
status: "{status}"
criado_em: "{agora.strftime('%Y-%m-%dT%H:%M:%S')}"
tags: [tarefa, {kebab(setor)}, {kebab(prioridade)}]
---

# {emoji} {assunto}

**ID:** {task_id}
**Criador:** {criador}
**Responsável:** {responsavel}
**Setor:** {setor}
**Prioridade:** {prioridade}
**Data de Lançamento:** {br_date(data_lancamento)}
**Previsão de Término:** {br_date(previsao) if previsao else '—'}
**Status:** {status}

## Descrição

{descricao_md}

## Histórico

- {agora.strftime('%d/%m/%Y, %H:%M:%S')} — Tarefa importada do Notion
"""
    target = out_dir / filename
    if not dry_run:
        target.write_text(note, encoding="utf-8")
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("staging", type=Path, help="pasta com notas importadas do Notion")
    parser.add_argument("--out", type=Path, default=Path("vault/Tarefas"),
                        help="pasta de destino (padrão: vault/Tarefas)")
    parser.add_argument("--criador", default="Jonacir", help="criador padrão")
    parser.add_argument("--dry-run", action="store_true", help="só mostra o que seria feito")
    args = parser.parse_args()

    if not args.staging.is_dir():
        sys.exit(f"erro: pasta não encontrada: {args.staging}")

    existentes = [int(m.group(1)) for f in args.out.glob("TAREFA-*.md")
                  if (m := re.match(r"TAREFA-(\d+)", f.name))]
    next_id = max(existentes, default=0) + 1

    convertidos = ignorados = 0
    for md in sorted(args.staging.rglob("*.md")):
        if md.name == "Leia-me.md":
            continue
        target = normalize(md, args.out, args.criador, next_id, args.dry_run)
        if target:
            convertidos += 1
            next_id += 1
            print(f"{'[dry-run] ' if args.dry_run else ''}convertido: {md.name} -> {target}")
        else:
            ignorados += 1
            print(f"ignorado (não parece tarefa, triar manualmente): {md.name}")

    print(f"\n{convertidos} convertido(s), {ignorados} ignorado(s).")
    if convertidos and not args.dry_run:
        print("Revise os arquivos gerados e remova os originais do staging após a triagem.")


if __name__ == "__main__":
    main()
