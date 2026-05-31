#!/usr/bin/env python3
"""Obsidian vault processing tools: link checking, tag listing, orphan finding, HTML export."""

import argparse
import re
import sys
from pathlib import Path
from html import escape

WIKILINK = re.compile(r'\[\[([^\]|#]+?)(?:[|#][^\]]*)?\]\]')
TAG = re.compile(r'(?:^|\s)#([\w/-]+)', re.MULTILINE)
FRONTMATTER = re.compile(r'^---\s*\n(.*?)\n---\s*\n', re.DOTALL)


def find_notes(vault: Path) -> list[Path]:
    return sorted(vault.rglob('*.md'))


def note_name(path: Path) -> str:
    return path.stem


def build_name_map(notes: list[Path]) -> dict[str, Path]:
    return {note_name(p): p for p in notes}


def check_links(vault: Path) -> int:
    notes = find_notes(vault)
    name_map = build_name_map(notes)
    broken = []
    for note in notes:
        text = note.read_text(encoding='utf-8')
        for match in WIKILINK.finditer(text):
            target = match.group(1).strip()
            if target not in name_map:
                broken.append((note.relative_to(vault), target))
    if broken:
        print(f"Found {len(broken)} broken link(s):\n")
        for src, target in broken:
            print(f"  {src}  →  [[{target}]]")
        return 1
    print(f"All links OK ({len(notes)} notes checked).")
    return 0


def list_tags(vault: Path) -> int:
    notes = find_notes(vault)
    tag_map: dict[str, list[str]] = {}
    for note in notes:
        text = note.read_text(encoding='utf-8')
        for tag in TAG.findall(text):
            tag_map.setdefault(tag, []).append(note_name(note))
    if not tag_map:
        print("No tags found.")
        return 0
    for tag in sorted(tag_map):
        notes_list = ', '.join(sorted(tag_map[tag]))
        print(f"#{tag}  ({len(tag_map[tag])})  —  {notes_list}")
    return 0


def find_orphans(vault: Path) -> int:
    notes = find_notes(vault)
    name_map = build_name_map(notes)
    referenced: set[str] = set()
    for note in notes:
        text = note.read_text(encoding='utf-8')
        for match in WIKILINK.finditer(text):
            referenced.add(match.group(1).strip())
    orphans = [p for p in notes if note_name(p) not in referenced]
    if orphans:
        print(f"{len(orphans)} orphan note(s) (no incoming links):\n")
        for p in orphans:
            print(f"  {p.relative_to(vault)}")
    else:
        print("No orphans found.")
    return 0


def strip_frontmatter(text: str) -> tuple[str, str]:
    m = FRONTMATTER.match(text)
    if m:
        return m.group(1), text[m.end():]
    return '', text


def md_to_html(text: str, name_map: dict[str, Path]) -> str:
    def replace_link(m: re.Match) -> str:
        target = m.group(1).strip()
        label = m.group(0)
        display = m.group(1).split('|')[-1] if '|' in m.group(1) else target
        if target in name_map:
            return f'<a href="{escape(target)}.html">{escape(display)}</a>'
        return f'<span class="broken-link">{escape(display)}</span>'

    body = escape(text)
    # Restore wikilinks after escaping (re-run on original)
    body = WIKILINK.sub(lambda m: replace_link(m), text)
    lines = body.splitlines()
    html_lines = []
    for line in lines:
        if line.startswith('# '):
            html_lines.append(f'<h1>{line[2:]}</h1>')
        elif line.startswith('## '):
            html_lines.append(f'<h2>{line[3:]}</h2>')
        elif line.startswith('### '):
            html_lines.append(f'<h3>{line[4:]}</h3>')
        elif line.startswith('- ') or line.startswith('* '):
            html_lines.append(f'<li>{line[2:]}</li>')
        elif line.strip() == '':
            html_lines.append('<br>')
        else:
            html_lines.append(f'<p>{line}</p>')
    return '\n'.join(html_lines)


def export_html(vault: Path, out_dir: Path) -> int:
    notes = find_notes(vault)
    name_map = build_name_map(notes)
    out_dir.mkdir(parents=True, exist_ok=True)
    for note in notes:
        text = note.read_text(encoding='utf-8')
        _front, body = strip_frontmatter(text)
        content = md_to_html(body, name_map)
        title = escape(note_name(note))
        html = (
            '<!DOCTYPE html><html lang="en"><head>'
            f'<meta charset="utf-8"><title>{title}</title>'
            '<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;}'
            'a{color:#6b57d6;}.broken-link{color:#c0392b;text-decoration:line-through;}'
            '</style></head><body>'
            f'<h1>{title}</h1>{content}</body></html>'
        )
        out_file = out_dir / (note_name(note) + '.html')
        out_file.write_text(html, encoding='utf-8')
        print(f"  {out_file.relative_to(out_dir.parent)}")
    print(f"\nExported {len(notes)} note(s) to {out_dir}/")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser(description='Obsidian vault tools')
    parser.add_argument('vault', type=Path, help='Path to Obsidian vault directory')
    sub = parser.add_subparsers(dest='command', required=True)

    sub.add_parser('check-links', help='Report broken [[wikilinks]]')
    sub.add_parser('list-tags', help='List all #tags with their notes')
    sub.add_parser('find-orphans', help='Find notes with no incoming links')
    exp = sub.add_parser('export-html', help='Export notes to static HTML')
    exp.add_argument('--out', type=Path, default=Path('export'), help='Output directory')

    args = parser.parse_args()
    vault = args.vault.expanduser().resolve()
    if not vault.is_dir():
        print(f"Error: '{vault}' is not a directory.", file=sys.stderr)
        sys.exit(1)

    if args.command == 'check-links':
        sys.exit(check_links(vault))
    elif args.command == 'list-tags':
        sys.exit(list_tags(vault))
    elif args.command == 'find-orphans':
        sys.exit(find_orphans(vault))
    elif args.command == 'export-html':
        sys.exit(export_html(vault, args.out))


if __name__ == '__main__':
    main()
