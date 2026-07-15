---
criado: 2026-07-14
status: estagnado
prazo:
área: Planejamento
tags: [projeto, diario-de-obras, rdo, app, cesbe]
---

# Diário de Obras (App RDO) — Cesbe Engenharia

**Status:** ⏸️ Estagnado (15/07/2026) — decisão do usuário de congelar este app e migrar o
desenvolvimento ativo para um projeto novo, separado ("Diário Premium" — nome, repo e planilha
próprios). Ver [[Recursos/Anexos/HANDOFF-Diario-Premium-novo-projeto]] para o briefing do novo
projeto. Este app segue existindo e recebendo só correções pontuais/reconstrução histórica
pendente (PDFs de junho-julho/2026) — nenhuma feature nova aqui.
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
- **BUG GRAVE descoberto 15/07/2026 — perda recorrente de memória local (não é evento único):**
  Investigando reclamação do usuário de que "a cada nova versão perde a memória dos diários
  anteriores", baixei e decodifiquei ~20 backups do Drive (pastas duplicadas "Suzano - ETA",
  "Suzano", "Obra"). Achado: `state.obra.nome` e `history` local **voltam vazios repetidas
  vezes** (não só uma vez) — ex: backup 2026-07-12 18:49 (obra vazia, 1 dia), backup
  2026-07-13 19:51 (obra "Suzano" ok, mas só 1 dia no history), backup 2026-07-14 17:27
  (obra vazia de novo, só 1 dia). Toda vez que `obra.nome` fica vazio, `backupNuvem()` usa
  `state.obra.nome || 'Obra'` como nome de pasta no Drive, criando uma pasta nova "Obra" —
  por isso há 11+ pastas "Suzano - ETA" duplicadas. **Causa mais provável: reinstalação do
  ícone PWA na tela de início do iPhone cria um container de localStorage separado/zerado.**
  Cada vez que isso acontece, `history` local também zera e só acumula o dia corrente a partir
  dali (nunca mais que 1 dia por backup) — mas a **planilha "Diário" nunca é afetada** (é
  gravada direto pelo Apps Script, fonte de verdade). Confirmado em 15/07/2026: planilha tinha
  9 dias intactos (06/07 a 14/07) mesmo com o app local zerado.
  **Ação tomada:** reconstruído `history` dos 9 dias a partir da planilha + cadastro do backup
  confirmado, entregue arquivo único de restauração ao usuário (import via Cadastro → Restaurar
  do Arquivo) — zero redigitação.
  **Pendente para v21:** (1) investigar/confirmar se é reinstalação do ícone PWA causando o
  problema (perguntar ao usuário quantas vezes reinstalou); (2) nunca deixar `backupNuvem()`
  criar pasta "Obra" silenciosamente — se `obra.nome` vier vazio, é sinal de perda de estado e
  deve alertar/bloquear em vez de seguir criando pasta nova; (3) considerar que a planilha
  Sheets é a fonte de verdade mais robusta — avaliar buscar automaticamente da planilha (não só
  do backup local/Drive) ao detectar `history` vazio ou incompleto.

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

- [ ] **Em andamento — 1ª leva pronta, aguardando revisão do usuário (15/07/2026).** Reconstrução
      histórica de RDOs. Obra iniciou em 01/09/2025; testes no app só começaram em 13/07/2026
      (RDO Nº1 ficou marcado errado como marco zero). Usuário forneceu export do WhatsApp do
      grupo "SUZANO Ribas Garantia" (25/08/2025 a 14/07/2026, ~2450 mensagens).
      **Entregue:** [[Recursos/Anexos/RDO-historico-reconstruido-whatsapp-21out2025-a-03jul2026]]
      — 72 RDOs (RDO Nº1 = marco de mobilização em 21/10/2025; RDO Nº2 a 72 = dias com evidência
      literal de trabalho executado no grupo, até 03/07/2026). Extração 100% literal das
      mensagens, nada inventado — vários dias (a partir de fev/2026) já vêm com "Relatório de
      Atividades" formal do Jekyll incluindo efetivo declarado. Dias mais antigos (nov/dez 2025)
      têm menos detalhe (mensagens curtas tipo "atividade iniciada").
      **2ª e 3ª levas entregues (15/07/2026) — RDOs OFICIAIS em PDF, mais confiáveis que o
      WhatsApp.** Usuário enviou 8 PDFs originais "RELATÓRIO DIÁRIO DE OBRA" (SAMARC ENGENHARIA
      LTDA × CESBE S.A., Contrato Nº 8700): RDO_SAMARC_INOCENCIA (set/2025), RDO_SAMARC_CESBE
      (dez/2025, jan/2026, fev/2026 ×2 cópias idênticas, mar/2026), e dois PDFs
      escaneados/manuscritos (abr/2026 e mai/2026, lidos página a página via visão, já que não
      tinham camada de texto). Extraído com `pdftotext -layout` + parser Python para os digitais;
      leitura visual manual para os 2 escaneados.
      **Entregue:** [[Recursos/Anexos/RDO-oficial-PDF-set2025-dez2025-jan2026-abr2026-mai2026]]
      — **102 dias** com efetivo (M.O.I./M.O.D. detalhado), serviços e comentários/observações
      transcritos literalmente, RDO Nº 1 a 140 (sequência oficial do contratado). Contrato tem
      2 fases visíveis: Data Contratual 25/06/2025 (set/2025-mar/2026, RDO 1-140) e 09/03/2026
      (fase garantia/retrabalho, abr-mai/2026, bate com o nome do grupo WhatsApp
      "SUZANO Ribas Garantia").
      **GAPs restantes:** 11 a 16/03/2026 (RDO Nº 133-136, nenhum PDF enviado cobre ainda);
      outubro e novembro de 2025 (só cobertura informal via WhatsApp, sem RDO oficial).
      **Pendente:** usuário revisar/validar toda a numeração e conteúdo antes de qualquer uso
      oficial — os RDOs já emitidos pela planilha (06/07/2026 em diante) têm numeração própria
      (1, 2, 4...) que não bate com nenhuma das sequências históricas; decisão de renumerar
      definitivamente é do usuário. Depois da validação completa: gerar arquivo de importação
      único pro app (mesclando com backup atual) e/ou lançar em lote na planilha via upsert.
      **Regra mantida:** nunca inventar dados operacionais (é documento contratual) — toda
      extração é literal/transcrita, nunca inferida ou estimada.
      **4ª leva — arquivo de importação único entregue (15/07/2026), aguardando PDFs de
      junho/julho para fechar de vez.** Usuário pediu para gerar já um backup pro app cobrindo
      "do dia 1 até hoje", numeração sequencial automática (o app calcula RDO Nº pela posição
      cronológica da data no `history` — ver `numeroRDO()` em index.html linha ~5240 — não
      precisa de campo manual). Mesclado por prioridade **PDF oficial > planilha (06-14/07) >
      WhatsApp** (WhatsApp só preenche gaps sem PDF: out-nov/2025 e trechos sem PDF entre
      mai-jul/2026). Dias de fonte PDF ficam com `efetivo: {}` vazio (formulário oficial não
      lista nomes, só contagem por categoria — não dava pra mapear pra pessoa sem inventar) e
      o resumo (efetivo por categoria + serviços + comentários) vai em `observacoesDia` com tag
      `[RDO OFICIAL Nº X — fonte]`. Dias de fonte WhatsApp tentam mapear efetivo por nome citado
      no texto (heurística, pode falhar silenciosamente — revisar se algo parecer errado).
      **Entregue:** [[Recursos/Anexos/RESTAURAR-HISTORICO-COMPLETO-05set2025-a-14jul2026]] — 149
      dias, de 05/09/2025 (RDO oficial Nº1) a 14/07/2026. Import via app: Cadastro → Backup em
      Arquivo → Importar Arquivo.
      **Aguardando do usuário:** PDFs de junho e julho/2026 (ele vai cobrar a empresa) — quando
      chegarem, gerar novo arquivo de importação substituindo/completando esse, fechando o
      histórico por inteiro sem nenhum gap.
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
