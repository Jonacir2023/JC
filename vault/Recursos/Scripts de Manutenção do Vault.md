---
criado: 2026-06-08
tags: [recurso, scripts, python, manutenção]
---

# Scripts de Manutenção do Vault

Ferramentas CLI em Python para verificação e manutenção do vault do Obsidian.

---

## Arquivo

`scripts/obsidian_tools.py`

---

## Comandos Disponíveis

### Verificar links quebrados
```bash
python scripts/obsidian_tools.py vault/ check-links
```
Detecta `[[wikilinks]]` que apontam para notas inexistentes.

---

### Listar todas as tags
```bash
python scripts/obsidian_tools.py vault/ list-tags
```
Lista todas as `#tags` encontradas no vault com a contagem e quais notas as usam.

---

### Encontrar notas órfãs
```bash
python scripts/obsidian_tools.py vault/ find-orphans
```
Encontra notas que nenhuma outra nota referencia via `[[wikilink]]`.

---

### Exportar para HTML estático
```bash
python scripts/obsidian_tools.py vault/ export-html --out export/
```
Gera versão HTML de todas as notas, convertendo `[[wikilinks]]` em `<a href>`.

---

## Quando usar

| Situação | Comando |
|---|---|
| Após renomear/mover notas | `check-links` |
| Revisão periódica de conteúdo | `find-orphans` |
| Backup ou compartilhamento externo | `export-html` |
| Auditoria de categorias | `list-tags` |

---

## Relacionado

- [[Notas/Sistema JC - Estrutura e Convenções]]
- [[Recursos/N8N - Integração de Tarefas]]
