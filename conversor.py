#!/usr/bin/env python3
"""
Conversor: Relatório de Obra (WhatsApp) → Nota Obsidian (.md)
Uso: python conversor.py relatorio.txt
"""

import sys
import re
from datetime import datetime
from pathlib import Path

TEAM_EMOJIS = ['👷', '⚙️', '🔧', '🧱', '🔍', '🚧', '⚡', '🚛']


def parse_date(text):
    m = re.search(r'(\d{2}/\d{2}/\d{4})', text)
    return m.group(1) if m else datetime.today().strftime('%d/%m/%Y')


def is_separator(line):
    stripped = line.strip()
    return stripped in ('⸻', '—', '---', '–') or re.fullmatch(r'[-–—⸻]+', stripped) is not None


def is_team_header(line):
    return any(e in line for e in TEAM_EMOJIS) and ('—' in line or '-' in line)


def parse_report(text):
    data = {
        'date': '',
        'jornada': [],
        'dss': '',
        'atividades': [],
        'equipes': [],
        'total': '',
    }

    mode = None
    current_team = None

    for line in text.splitlines():
        stripped = line.strip()

        if not stripped or is_separator(stripped):
            continue

        # Título / Data
        if stripped.startswith('Relatório de Obra'):
            data['date'] = parse_date(stripped)
            mode = None

        # Seções principais
        elif '⏰' in stripped:
            mode = 'jornada'

        elif 'DSS' in stripped and ('📋' in stripped or 'Tema' in stripped):
            mode = 'dss'

        elif '🛠' in stripped:
            mode = 'atividades'

        elif 'Efetivo' in stripped and '📋' in stripped:
            mode = 'efetivo'
            current_team = None

        elif '✅' in stripped and 'Total' in stripped:
            data['total'] = re.sub(r'✅\s*', '', stripped).strip()
            mode = None

        # Cabeçalho de equipe (ex: 👷‍♂️ Engenharia / Supervisão — 6)
        elif is_team_header(stripped):
            current_team = {'nome': stripped, 'membros': []}
            data['equipes'].append(current_team)
            mode = 'efetivo'

        # Itens de lista (começam com *)
        elif stripped.startswith('*'):
            item = stripped.lstrip('* ').strip()
            if mode == 'jornada':
                data['jornada'].append(item)
            elif mode == 'dss':
                data['dss'] = (data['dss'] + ' ' + item).strip()
            elif mode == 'atividades':
                data['atividades'].append(item)
            elif mode == 'efetivo' and current_team:
                current_team['membros'].append(item)

        # Texto livre (tema do DSS sem asterisco, ex: "Isolamento de Área")
        elif mode == 'dss' and not any(e in stripped for e in ['📋', '⸻']):
            data['dss'] = (data['dss'] + ' ' + stripped).strip()

    return data


def to_obsidian(data):
    date_raw = data['date']
    try:
        dt = datetime.strptime(date_raw, '%d/%m/%Y')
        iso = dt.strftime('%Y-%m-%d')
        dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira',
                'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
        dia_semana = dias[dt.weekday()]
    except ValueError:
        iso = date_raw
        dia_semana = ''

    total_n = re.search(r'\d+', data.get('total', ''))
    total_n = total_n.group() if total_n else '?'

    out = []

    # Frontmatter Obsidian
    out += [
        '---',
        f'data: {iso}',
        f'dia_semana: {dia_semana}',
        f'total_colaboradores: {total_n}',
        f'dss: "{data["dss"]}"',
        'tags:',
        '  - diario-obra',
        '---',
        '',
        f'# Relatório de Obra — {date_raw}',
        '',
    ]

    # Jornada
    out += ['## ⏰ Jornada de Trabalho', '']
    for item in data['jornada']:
        out.append(f'- {item}')
    out.append('')

    # DSS
    out += ['## 📋 DSS — Diálogo de Segurança', '', f'> {data["dss"]}', '']

    # Atividades
    out += ['## 🛠️ Atividades do Dia', '']
    for item in data['atividades']:
        out.append(f'- {item}')
    out.append('')

    # Efetivo
    out += [f'## 👷 Efetivo — {date_raw}', '']
    for equipe in data['equipes']:
        out += [f'### {equipe["nome"]}', '']
        for membro in equipe['membros']:
            out.append(f'- {membro}')
        out.append('')

    # Total
    if data['total']:
        out += ['---', f'**✅ {data["total"]}**', '']

    return '\n'.join(out)


def main():
    if len(sys.argv) < 2:
        print('Uso: python conversor.py relatorio.txt')
        sys.exit(1)

    path = Path(sys.argv[1])
    if not path.exists():
        print(f'Erro: arquivo "{path}" não encontrado.')
        sys.exit(1)

    text = path.read_text(encoding='utf-8')
    data = parse_report(text)
    md = to_obsidian(data)

    date_str = data['date'].replace('/', '-')
    output = Path(f'diario_{date_str}.md')
    output.write_text(md, encoding='utf-8')

    print(f'✅ Arquivo gerado: {output}')
    print(f'   Data:       {data["date"]} ({data.get("dia_semana","")})')
    print(f'   DSS:        {data["dss"]}')
    print(f'   Atividades: {len(data["atividades"])} registradas')
    print(f'   Equipes:    {len(data["equipes"])} grupos')
    print(f'   Total:      {data["total"]}')


if __name__ == '__main__':
    main()
