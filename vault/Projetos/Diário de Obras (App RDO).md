---
criado: 2026-07-14
status: ativo
prazo:
área: Planejamento
tags: [projeto, diario-de-obras, rdo, app, cesbe]
---

# Diário de Obras (App RDO) — Cesbe Engenharia

**Status:** 🟡 Em andamento
**Área:** Planejamento
**Responsável:** Jonacir Cazelli (engenheiro civil, gerente de obras GO/PR)

---

## Objetivo

App HTML standalone (PWA) de Diário de Obras / RDO para a Cesbe Engenharia. Repositório e
código-fonte ficam fora do JC (repo separado `diario-obras`), mas a planilha que alimenta
esse app é a mesma fonte lida pela automação [[Notas/RESUMO-automacao-sheets-obsidian|Sheets → Obsidian]]
que popula `vault/Diário/` neste vault. Este projeto documenta o contexto operacional do app
para consulta rápida a partir do JC.

---

## Endereços e arquitetura

| Item | Valor |
|---|---|
| App publicado | https://jonacir2023.github.io/diario-obras/ |
| Repositório | https://github.com/Jonacir2023/diario-obras |
| Upload manual | https://github.com/Jonacir2023/diario-obras/upload/main |
| Planilha (Sheets) | "JC - Gestão de Obras", ID `19fTP_qyxv1QiLdxBz3jbvTb46DKedrkApEVExmSxKEM`, aba **Diário** (25 colunas, A=Data...Y=RDO Nº) |
| Apps Script (backend) | mesmo endpoint `/exec` para diário/pauta/checkin/fotos/backup (v5) |
| Fotos | Google Drive → `Diario de Obras - Fotos / [Obra] / [Data]` |
| Backups | Google Drive → `Diario de Obras - Backups / [Obra]` (30 mais recentes, 1x/dia automático + botão manual) |

CLAUDE.md de referência do projeto: `~/diario-obras/CLAUDE.md` (máquina local do usuário, fora
deste repositório).

---

## Regras operacionais críticas

- **Nunca testar integrações** (planilha/fotos/backup) em arquivo local ou HTML Viewer — contexto
  `file://` bloqueia POST. Só funciona no endereço publicado (GitHub Pages).
- **Atualizar o app:** subir `index.html` em `/upload/main` → Commit → aguardar ~1 min → fechar e
  reabrir pelo ícone (nunca abrir o arquivo direto).
- **Atualizar o Apps Script:** colar código → Salvar → Implantar → Gerenciar implantações → editar
  (lápis) → Nova versão → Implantar. Sem esse passo final, nada entra no ar.
- **Nunca** recomendar apagar dados de sites do Safari como solução de cache — apaga todo o
  localStorage (cadastros + histórico). Se não atualizar visualmente: fechar e reabrir, aguardar
  propagação do GitHub Pages (~1–2 min).
- App vazio → botão "☁️ Restaurar da Nuvem" em Cadastro. Nunca redigitar dados.
- Atualização normal de código nunca apaga dados locais (armazenamentos independentes).
- Ícone da tela de início só precisa ser recriado se um `icon.png` novo for entregue.

---

## Fila de desenvolvimento (ordem confirmada com o usuário)

- [ ] **Em andamento** — Reconstrução histórica de RDOs. Obra iniciou em 01/09/2025; testes no
      app só começaram em 13/07/2026 (RDO Nº1 ficou marcado errado como marco zero). Aguardando
      do usuário: nome/local da obra, PDFs de registros antigos, export do ChatGPT, backup atual
      do app. Plano: extrair dados dos PDFs/conversas, cruzar histórico meteorológico real,
      gerar arquivo de importação único (mescla com backup atual), botão de reenvio em lote via
      upsert. Alternativa mais rápida se fontes forem insuficientes: um único RDO Nº 001 de marco
      de mobilização — **nunca inventar dados operacionais** (é documento contratual).
- [ ] Multi-obra — cadastrar/alternar obras, cada uma com cadastros/histórico próprios.
- [ ] SINAPI — usuário vai listar problemas do fluxo de orçamentação antes de retomar (projeto
      separado; ver [[Recursos/SINAPI-MG-Industrial]]).
- [ ] Dashboard de indicadores (chuva/impraticáveis no mês, curva de efetivo, horas de
      equipamento, avanço de atividades).
- [ ] Boletim de Medição a partir das quantidades já lançadas nos diários.
- [ ] Notificações (diário não preenchido, alertas via @Assuntos_bot no Telegram).
- [ ] Multi-usuário por apontador (avaliar Supabase) — só se demanda real aparecer.

---

## Funcionalidades atuais (resumo)

- **Aba Diário:** clima em 4 períodos, jornada/DSS/local, efetivo por categoria (com terceirizado
  por empresa), equipamentos + horímetros, veículos, paralisações com justificativa, atividades
  do dia, observações, eventos de segurança/meio ambiente, fotos (até 20, vinculadas a atividade),
  apontador responsável.
- **Aba Gerar:** relatório WhatsApp (Web Share API), PDF do RDO (capa, resumo geral, seções na
  mesma ordem da aba Diário, efetivo sem lista nominal, assinatura em tela).
- **Cadastro:** dados da obra, colaboradores, equipamentos, veículos, atividades, backup local +
  nuvem, restauração com 1 toque, banner automático de restauração se o app abrir vazio.
- **Calendário:** histórico navegável, edição de diários passados.
- **Resumo/Acumulado:** soma de quantidades por atividade num período.

---

## Apps Script (`DiarioObras.gs`) — v5

- Upsert do diário por Data+Apontador com normalização de data/apontador — essencial para não
  duplicar linhas quando o Sheets converte a data para tipo `Date`.
- `limparDuplicatasDiario()` — remove duplicatas mantendo a mais recente por Data+Apontador.
- `buscarUltimoBackup(obra)` — retorna o backup mais recente da pasta da obra.
- Migração automática de cabeçalho (todas as 25 colunas) ao salvar.

---

## Relacionado

- [[Notas/RESUMO-automacao-sheets-obsidian]] — a mesma planilha "JC - Gestão de Obras" alimenta
  `vault/Diário/` via GitHub Actions
- [[Diário/Índice de Diário]]
- [[Templates/Diário de Obras]]
- [[Recursos/SINAPI-MG-Industrial]]
- Projetos relacionados fora do escopo deste vault: Chekin (Kanban de reuniões de obra) e Pauta —
  ainda no HTML Viewer, pendente migrar para subpastas do mesmo GitHub Pages (`chekin/`, `pauta/`)
