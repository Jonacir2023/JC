---
criado: 2026-07-15
tipo: handoff
finalidade: briefing para novo chat — início do projeto "Diário Premium"
---

# Handoff — Início do projeto "Diário Premium" (novo, separado do app atual)

**Leia isto no início da nova conversa.** Este documento resume tudo que você (Claude) precisa
saber para começar o novo projeto sem re-perguntar o que já foi decidido, e sem misturar com o
app antigo.

---

## Decisão do usuário (15/07/2026)

O app atual (**Diário de Obras**, repo `diario-obras`, v19/v20/v21) fica **estagnado** —
mantido como está, sem novas features, só correções pontuais se pedidas. Todo o esforço de
desenvolvimento daqui pra frente vai para um **projeto novo, com nome novo, planilha nova e
repositório Git novo**: o **"Diário Premium"** (nome provisório — usuário pode already ter um
nome definitivo, perguntar se não tiver).

**Motivo explícito do usuário:** evitar "perder tempo" e "entrar em discussão" repetindo os
problemas que consumiram a sessão anterior (perda de dados, confusão de obra, bugs de migração).
Começar limpo, sem herdar a bagagem técnica do app antigo.

---

## O que NÃO fazer no novo projeto

Isso é a lista de erros reais que já causaram muita frustração — não repetir:

1. **Nunca recomendar limpar dados do site/Safari como solução de cache.** Isso apaga
   localStorage inteiro (cadastro + histórico). Documentado como regra crítica no projeto antigo
   e violado uma vez por engano — causou a pior crise da sessão.
2. **Nunca deixar o app cair silenciosamente em estado "vazio"/obra sem nome.** Se isso
   acontecer, o app deve travar/alertar, não seguir criando pasta genérica no Drive
   (aconteceu no antigo: 11+ pastas duplicadas "Suzano - ETA" no Google Drive por causa disso).
3. **Cuidado com PWA + modo de navegação privada do Safari (iOS).** Foi identificado como causa
   provável de perda de dados recorrente — Safari privado isola/descarta localStorage entre
   sessões. Se o novo app for PWA local-first, considerar isso desde o design (ex: aviso se
   detectar modo privado, ou depender menos de localStorage puro).
4. **history/dados locais nunca devem depender só do dispositivo.** No app antigo, o `history`
   local se mostrou frágil (resetava sem explicação clara, mesmo fora do incidente do modo
   privado). Se o novo projeto usar backend (Supabase, Sheets, etc.), preferir ele como fonte de
   verdade desde o início, com o local só como cache.
5. **Nunca inventar dados operacionais** (efetivo, quantidades, atividades) em documentos tipo
   RDO — são documentos contratuais. Sempre que faltar dado, deixar em branco/marcar como
   pendente, nunca estimar ou inferir.
6. **Sempre perguntar antes de indicar qualquer limpeza/reset de dados do usuário** — a régua
   é: NUNCA pedir pro usuário apagar/redigitar cadastros manualmente. Se algo quebrar, a solução
   é restaurar de backup automaticamente, não mandar o usuário refazer trabalho manual.

---

## Contexto do app antigo (para não confundir os dois projetos)

- **Nome:** Diário de Obras · **Repo:** `Jonacir2023/diario-obras` (fora do repo JC) ·
  **Publicado:** https://jonacir2023.github.io/diario-obras/
- **Obra ativa nele:** Suzano/ETA (Ribas do Rio Pardo-MS), Cesbe S.A., contrato SAMARC Nº 8700
- **Cadastro confirmado (8 colaboradores):** Jonacir Cazelli, Jekyll da Costa Vinente, Claudemir
  Aparecido Ferreira, Ivanildo Silva Sena, Francisco dos Santos Silva, Gabriel Ferreira dos
  Santos, Gustavo Gabriel Lima Ferreira, Moises da Silva Cristo
- **Reconstrução histórica em andamento** (149 dias, 05/09/2025 a 14/07/2026, ver
  [[Recursos/Anexos/RESTAURAR-HISTORICO-COMPLETO-05set2025-a-14jul2026]]) — ainda faltam PDFs de
  11-16/03/2026 e junho/julho/2026 que o usuário vai cobrar da empresa e enviar depois. **Esse
  trabalho continua no app antigo, não migra pro novo.**
- Documentação completa do estado antigo: [[Projetos/Diário de Obras (App RDO)]] (não mexer
  nessa nota como parte do projeto novo — ela é só histórico/referência).

**Se o usuário pedir pra continuar o trabalho de reconstrução histórica do app antigo (ex:
"cheguei os PDFs de junho"), isso é uma continuação do projeto ANTIGO, não do Diário Premium —
tratar como tarefa separada, idealmente em outra conversa ou deixando claro que é sobre o app
estagnado, não o novo.**

---

## O que perguntar ao usuário no início da nova conversa

Não presumir — perguntar antes de criar qualquer coisa:

1. **Nome definitivo** do "Diário Premium" (ou nome provisório que ele quiser usar).
2. **Novo repositório Git:** nome, se já existe ou se preciso criar (via `mcp__github__create_repository` ou instruir upload manual, dependendo do que ele preferir). Confirmar se GitHub Pages será o método de publicação de novo.
3. **Nova planilha:** criar do zero no Google Drive/Sheets (`mcp__Google_Drive__create_file` com mimeType de planilha), ou ele já tem uma?
4. **O que "premium" significa aqui:** diferenças de escopo/funcionalidades em relação ao app
   antigo — perguntar o que ele quer de diferente/melhor, não assumir que é só um reskin.
5. **Vai reaproveitar algum código do app antigo** (index.html, Apps Script) como ponto de
   partida, ou é implementação 100% nova?

---

## Ferramentas relevantes disponíveis nesta conta (contexto técnico)

- MCP GitHub (`mcp__github__*`) — criar repositório, push de arquivos, PRs
- MCP Google Drive (`mcp__Google_Drive__*`) — criar planilha, pastas, buscar arquivos
- Repo `JC` (este vault Obsidian) é o único repo já registrado nesta sessão do Claude Code — um
  repo novo para o Diário Premium precisa ser adicionado via `add_repo` ou criado do zero.
