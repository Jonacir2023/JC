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

### Colunas da aba Diário (confirmado no código-fonte, v5)

`A` Data · `B` Dia da Semana · `C` Obra · `D` Empresa · `E` Cidade · `F` Local da Obra ·
`G` Descrição do Local · `H` Tempo / Clima · `I` Jornada · `J` DSS — Horário ·
`K` DSS — Ministrado Por · `L` DSS — Tema · `M` Atividades do Dia · `N` Efetivo Total ·
`O` Efetivo por Função · `P` Colaboradores Presentes · `Q` Equipamentos Utilizados ·
`R` Veículos Leves · `S` Veículos/Equip. Parados · `T` Eventos de Segurança ·
`U` Eventos de Meio Ambiente · `V` Observações do Dia · `W` Apontador · `X` Fotos · `Y` RDO Nº

### Código-fonte de referência

Cópias do código atual (fora do repo `diario-obras`, salvas aqui só para consulta rápida sem
depender de acesso a outro repositório):

- [[Recursos/Anexos/diario-obras-index.html]] — app completo (PWA, ~6.160 linhas). Visual
  "Paleta Concreto Rústico" (laranja óxido `#d4541a` / amarelo capacete `#e8a030` sobre fundo
  concreto claro `#e8e4df`), fontes Barlow / Barlow Condensed via Google Fonts, manifest PWA
  embutido em base64 no próprio `<head>`.
- [[Recursos/Anexos/DiarioObrasv5.gs]] — Apps Script backend (v5, ~480 linhas).

Estas cópias podem ficar desatualizadas — antes de assumir comportamento do app, prefira pedir o
arquivo atual ao usuário em vez de confiar cegamente nesta cópia.

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
- **Regra crítica (desde v20.1, 15/07/2026):** o usuário NUNCA deve precisar apagar/redigitar
  cadastros manualmente por causa de bug de migração/atualização. Se dados antigos aparecerem
  misturados após um update, a correção é sempre buscar o backup correto (Drive ou JSON) e
  restaurar automaticamente — nunca pedir para o usuário deletar colaboradores/equipamentos/
  atividades um por um. Ver dados de referência da obra Suzano abaixo.
- **Workflow de continuidade entre versões (acordado 15/07/2026):** o usuário faz backup no
  Drive a cada diário lançado. Antes de entregar qualquer nova versão do app, buscar o backup
  mais recente em `Diario de Obras - Backups/Suzano/` (Google Drive, `search_files` com
  `parentId` da pasta) e usar os dados de lá (cadastros + histórico) como base — nunca pedir
  pro usuário redigitar ou re-informar cadastros já existentes. Atualizar a tabela de dados de
  referência abaixo sempre que buscar um backup novo.

---

## Dados de referência confirmados — Obra Suzano (fonte: backup Drive, 13/07/2026 19:51)

**Obra:** Suzano · **Empresa:** Cesbe SA · **Local:** Ribas do Rio Pardo - MS · **Contrato:** 2022
**Local da obra atual:** ETA

Backup fonte: Google Drive → `Diario de Obras - Backups/Suzano/backup_2026-07-13_1951.json`
(fileId `1yADRmwXXnKyPIvmI9050F54mZb5Eo370`) — backup mais recente e confirmado pelo usuário em
15/07/2026 como correto. Usar este arquivo como fonte da verdade se precisar restaurar/comparar
dados da obra Suzano; nunca usar dados de "Rio Tanque" (obra anterior, já encerrada no app).

### Colaboradores (8 confirmados)

| Nome | Função | Empresa | Matrícula |
|---|---|---|---|
| Jonacir Cazelli | Gerente de obras | — | 26640 |
| Jekyll da Costa Vinente | Analista de DP / Apontador | — | 32901 |
| Claudemir Aparecido Ferreira | Encarregado | Samarc | 001 |
| Ivanildo Silva Sena | Encarregado | Samarc | 002 |
| Francisco dos Santos Silva | Pedreiro | Samarc | 003 |
| Gabriel Ferreira dos Santos | Ajudante | Samarc | 004 |
| Gustavo Gabriel Lima Ferreira | Ajudante | Samarc | 005 |
| Moises da Silva Cristo | Ajudante | Samarc | 006 |

### Equipamentos
- GUI-003 — Guindaste 100T
- BR-01 — Bomba de Recalque

### Veículos de frota
- VL-01 — Onix
- VL-02 — Onix
- VL-03 — Uno Way

### Atividades
- Enchimento de bags com areia (local: Filtro 2, unidade: Un)
- Inspeção de bags usados (local: ETA, unidade: Un)

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
