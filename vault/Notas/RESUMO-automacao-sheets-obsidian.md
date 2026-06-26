---
tipo: "Nota"
assunto: "Automação Google Sheets → Obsidian"
status: "Ativo"
criado_em: "2026-06-26"
tags: [automação, sheets, obsidian, github-actions]
---

# Automação Google Sheets → Obsidian

## Fluxo Atual

```
iPhone (HTML)  →  Google Sheets  →  GitHub Actions  →  Obsidian vault
```

1. **iPhone** — 3 formulários HTML instalados localmente (app HTML):
   - `pauta.html` → aba **Pautas**
   - `checkin.html` → aba **Checkins**
   - `diario.html` → aba **Diário de Obras**

2. **Google Sheets** (ID: `19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM`)
   - Planilha compartilhada como pública (leitura)
   - Fonte de verdade de todos os registros

3. **GitHub Actions** — roda a cada 30 minutos, grátis
   - Arquivo: `.github/workflows/sync-obsidian.yml`
   - Script: `scripts/sync_sheets_to_obsidian.py --once`
   - Lê novas linhas do Sheets via CSV público
   - Cria arquivos `.md` no vault via GitHub API

4. **Obsidian vault** (plugin obsidian-git)
   - `vault/Diário/DIARIO-{data}-{obra}.md`
   - `vault/Tarefas/PAUTA-{id}-{assunto}.md`
   - `vault/Tarefas/CHECKIN-{id}-{data}-{obra}.md`

---

## Scripts

| Arquivo | Função |
|---|---|
| `scripts/sync_sheets_to_obsidian.py` | Sincroniza Sheets → vault (roda no GitHub Actions) |
| `scripts/importar_sinapi_mg.py` | Importa composições SINAPI-MG da Caixa para orçamento |

---

## Secrets do Repositório (GitHub)

| Nome | Descrição |
|---|---|
| `GITHUB_PAT` | Token com escopo `repo` (validade 90 dias) |
| `SHEETS_ID` | ID da planilha Google Sheets |

Configurar em: **github.com/Jonacir2023/JC → Settings → Secrets → Actions**

---

## SINAPI-MG (Orçamento)

- Script `importar_sinapi_mg.py` baixa composições gratuitas da Caixa Econômica Federal
- Filtra composições de obras industriais (fundações, estrutura metálica, pavimentação, instalações)
- Salva na aba **SINAPI-MG** da planilha para uso em orçamentos

Para rodar:
```bash
pip install requests openpyxl
python scripts/importar_sinapi_mg.py --csv
```

---

## Custo Mensal

| Serviço | Custo |
|---|---|
| GitHub (repo + Actions) | Grátis |
| Google Sheets | Grátis |
| Obsidian | Grátis |
| **Total** | **R$ 0,00** |
