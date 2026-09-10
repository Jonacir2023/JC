# BUILDLy — ESTADO ATUAL CANÔNICO

**Atualizado:** 07/09/2026  
**Produto:** BUILDLy V1 + BUILDLy Premium V2.2.0-rc2  
**Repositório oficial:** `Jonacir2023/buildly`  
**Supabase produção:** `P3` — `ynmewxemcntafwoipybm`  
**Produção Premium alterada:** NÃO

## ATUALIZAÇÃO CANÔNICA — 07/09/2026 — RC2 / REGRESSÃO DE PROFUNDIDADE IDENTIFICADA

A declaração anterior `FEATURE COMPLETE` não é mais o estado vigente. Foi identificada regressão de profundidade: a V2.2 RC1 cobria muitos módulos, porém o RDO havia sido reduzido abaixo do que já existia no V1.

Estado atual:

```text
versão:                         2.2.0-rc2
FEATURE COMPLETE:               REVOGADO COMO ESTADO ATUAL
RDO baseline V1:                RECUPERADO
RDO browser funcional:          PASS
SQLs candidatos:                17 (00 + 01..15)
tabelas Premium candidatas:     30
produção P3:                     INTACTA
próxima regra:                   auditar profundidade V1 → V2 módulo por módulo
```

O RDO recuperado preserva clima em quatro períodos, chuva/operação, jornada, DSS, chamada e horas, equipamentos/operador/horímetro/paradas, atividades/quantidades/EAP, paralisações, SSMA, fotos, responsável, assinaturas, relatório/PDF, resumo e calendário.

Documentos de controle:
- `docs/MATRIZ_RDO_RECUPERADO.md`
- `docs/AUDITORIA_PROFUNDIDADE_V1_V2.md`
- `sql/15_rdo_premium.sql`
- `tests/rdo_regression_check.py`

---

## 1. Regra de ouro

O BUILDLy deve continuar existindo independentemente de qual IA esteja trabalhando nele.

Fonte de continuidade:

```text
Git + Supabase + documentação versionada
```

Fluxo obrigatório:

```text
Definir → Projetar → Aprovar → Implementar → Testar → Validar → Documentar → Liberar
```

Não aplicar migrations Premium em produção sem homologação.

---

## 2. Dois produtos/estados

### BUILDLy V1 — Legacy / produção

Continua sendo o sistema atual publicado e conectado ao Supabase P3.

Módulos atuais:

- RDO
- Cadastro
- Alertas
- Ocorrências
- Tarefas
- Notas Fiscais
- Medições
- Reuniões
- Relatórios
- Documentos

O V1 deve ser preservado até a V2 estar homologada.

### BUILDLy Premium V2

Novo aplicativo, separado do V1.

Estado atual:

```text
versão: 2.2.0-rc1
status: RC1 — Bateria 01 de frontend/lógica PASS; homologação PostgreSQL pendente
diretório local: buildly-premium-v2/
Git local: branch main
release base: BUILDLy Premium V2.2.0-fc1
tag canônica do kit: v2.2.0-fc1-homologacao-kit
working tree: limpa
```

A V2 já possui aplicação DEMO navegável, motor financeiro, RBAC demonstrável e pacote SQL completo candidato.

---

## 3. GitHub

Repositório:

```text
Jonacir2023/buildly
branch: main
```

A integração consegue ler, porém writes continuam bloqueados com:

```text
403 Resource not accessible by integration
```

Consequências:

- RC2 ainda não está sincronizada no GitHub remoto;
- não repetir tentativas equivalentes de write;
- estado atual está preservado no Git local;
- `CLAUDE.md` foi atualizado para passagem de contexto.

---

## 4. Supabase produção

Projeto:

```text
P3
ref: ynmewxemcntafwoipybm
região: sa-east-1
PostgreSQL observado: 17.6.1.166
status: ACTIVE_HEALTHY
```

**Nenhuma migration Premium foi aplicada em produção.**

---

## 5. Baseline V1 reconstruído

O banco atual possui histórico de 37 migrations, porém o SQL original dessas migrations não está versionado no GitHub.

Foi criado:

```text
sql/00_v1_schema_baseline.sql
```

É um snapshot estrutural reconstruído do V1 observado em 06/09/2026.

Contém:

```text
34 tabelas
12 views
11 funções
9 triggers
constraints
índices
RLS
policies
grants observados
```

Não contém dados reais.

### Regra

Esse baseline:

- NÃO é o SQL original das 37 migrations;
- serve apenas para banco NOVO/local/homologação;
- NUNCA deve ser aplicado sobre a produção existente.

---

## 6. Migrations V2 — sequência canônica

Existem 15 arquivos SQL:

```text
00_v1_schema_baseline.sql
01_seguranca.sql
02_hardening.sql
03_rls_multiobra.sql
04a_permissoes.sql
04b_rbac.sql
05_eap_cbs_orcamento.sql
06_contratos_premium.sql
07_motor_compromissos.sql
08_posicao_financeira.sql
09_planejamento.sql
10_documentos_premium.sql
11_auditoria.sql
12_rls_premium.sql
13_workflows_financeiros.sql
14_suprimentos.sql
```

Eles cobrem:

- baseline V1
- segurança
- hardening
- multiobra
- RBAC
- especialidades
- EAP
- CBS
- orçamento
- contratos Premium
- compromissos
- posição financeira
- planejamento
- GED
- auditoria
- workflows financeiros

---

## 7. Segurança / RBAC

Arquitetura:

```text
papel × obra × módulo × operação
```

O banco é a autoridade de segurança. O frontend apenas reflete permissões.

### Jonacir — proprietário global

- todas as obras;
- todos os módulos;
- todas as operações;
- atuais e futuras.

### Gestor da obra

- irrestrito somente dentro da própria obra;
- não é global apenas por ter papel `gestor`;
- não pode promover acesso global.

### Engenheiro base

- RDO: V/C/E/X
- Cadastro local: V/C/E/X
- Alertas: V
- Ocorrências: V/C/E/X
- Tarefas: V/C/E
- Medições: V/C/E
- Reuniões: V/C/E
- Relatórios: V/G
- Documentos: V/C/E
- NF: bloqueado para engenheiro comum

### Técnico

- RDO
- Cadastro
- Alertas
- Ocorrências
- Tarefas
- sem exclusão na matriz conservadora

### Analista

Igual ao Técnico nesta versão.

### Encarregado

- RDO
- Cadastro

### Apontador

Igual ao Encarregado.

### Administrativo

- RDO
- Cadastro
- Alertas
- Ocorrências
- Tarefas
- NFs
- futuro Custos

### Especialidades de Engenharia

Não são novos papéis rígidos.

**Medições/Custos**
- acrescenta NFs e Custos.

**Planejamento**
- acrescenta Planejamento.

Um engenheiro pode ter ambas.

---

## 8. Cadastro local x catálogo corporativo

### Local da obra

- pessoas
- contratos de pessoal
- equipamentos
- entregas de EPI

### Corporativo/global

- atividades
- EPIs
- funções
- EPI × função
- CBS

Usuários locais consultam; manutenção estrutural permanece inicialmente com o proprietário global.

---

## 9. Árvore da Obra

Navegação principal Premium:

```text
OBRA
├── Dashboard
├── Planejamento
├── EAP
├── Custos
├── Contratos
├── Medições
├── Notas Fiscais
├── RDO
├── Cadastro
├── Equipamentos
├── Efetivo
├── Alertas
├── Ocorrências
├── Tarefas
├── Reuniões
├── Relatórios
└── Documentos
```

Interface:

- árvore à esquerda;
- breadcrumb no topo;
- área de trabalho à direita;
- contexto preservado;
- drill-down por EAP.

A EAP integra:

```text
orçamento + CBS + contratos + planejamento + RDO + medições + NFs + documentos + custos
```

---

## 10. EAP e CBS

### EAP

Representa onde/o quê da obra.

É específica de cada obra e hierárquica.

### CBS

Representa natureza de custo.

Todo fato financeiro relevante deve chegar a:

```text
Obra + EAP + CBS + origem + competência
```

---

## 11. Núcleo financeiro

### Orçamento

```text
Orçamento Original
+ Alterações Aprovadas
= Orçamento Atual
```

### Comprometimento

Contrato/pedido aprovado consome orçamento imediatamente.

```text
Saldo Disponível
=
Orçamento Atual
- Valor Apropriado
```

Onde:

```text
Valor Apropriado
=
Realizado
+ Comprometido Restante
+ Reservas Aprovadas
```

### Regra anti-dupla-contagem

Exemplo:

```text
Orçamento Atual          R$ 100 mi
Contrato aprovado        R$ 12 mi
Saldo disponível         R$ 88 mi

Depois mede R$ 3 mi:

Realizado                 R$ 3 mi
Comprometido restante     R$ 9 mi
Valor apropriado         R$ 12 mi
Saldo disponível         R$ 88 mi
```

A medição não libera orçamento.

### Forecast

```text
Forecast / EAC
=
Realizado
+ Comprometido Restante
+ Estimativa ainda não contratada
```

### Pagamento

Pagamento muda estágio financeiro, não consome orçamento novamente.

---

## 12. Contratos Premium

Contrato passa a ser entidade estruturada com:

- fornecedor
- CNPJ
- objeto
- número
- status
- datas
- valor original
- valor atual
- EAP/CBS por item
- aditivos
- supressões
- medições
- NFs
- pagamentos
- documentos
- saldo

Workflow:

```text
Rascunho
→ Em Aprovação
→ Aprovado/Contratado
→ Ativo
→ Encerrado
```

Somente aprovado compromete verba.

---

## 13. Aprovação e imutabilidade

A RC2 prevê:

- baseline aprovada imutável;
- alteração orçamentária aprovada imutável;
- contrato aprovado exige itens EAP/CBS;
- contrato aprovado muda por aditivo/supressão;
- aditivo aprovado recalcula compromisso;
- medição aprovada imutável;
- NF aprovada/paga imutável;
- custo aprovado imutável;
- pagamento acima do saldo bloqueado;
- criação direta já em estado aprovado bloqueada.

Fluxos financeiros devem distinguir:

```text
criar
editar
submeter
aprovar
cancelar/reverter
```

---

## 14. Planejamento Premium

Fluxo alvo:

```text
Cronograma Base
→ Cronograma de Controle
→ Programação Quinzenal
→ Programação Semanal
→ RDO
→ Avanço Real
→ Curva S
```

Contém:

- cronograma
- avanço físico
- caminho crítico
- marcos
- lookahead
- restrições
- PPC
- Curva S

O cronograma base oficial permanece em Documentos.

---

## 15. Documentos / GED

Evolução prevista:

- código
- disciplina
- revisão
- status
- emissor
- responsável
- versão
- histórico
- aprovação
- vínculo EAP/contrato

Documentos oficiais:

- contrato principal
- orçamento base
- cronograma base
- projetos
- procedimentos
- atas
- correspondências

---

## 16. Auditoria

Fatos aprovados não devem desaparecer.

Trilha prevista para:

- orçamento
- contratos
- aditivos
- compromissos
- medições
- custos
- NFs
- pagamentos
- planejamento
- documentos

Correção por evento de reversão/estorno/cancelamento/nova revisão.

---

## 17. Aplicativo DEMO V2

Já possui:

- Árvore da Obra
- EAP
- CBS
- Dashboard
- Planejamento
- Orçamento
- Contratos
- Compromissos
- Medições
- Custos
- NFs
- Forecast
- RDO
- Documentos
- Tarefas
- Alertas
- Ocorrências
- Reuniões
- Equipamentos
- Efetivo
- Relatórios
- simulação RBAC
- persistência local
- exportação JSON
- restauração do DEMO

### Dados de teste

Em seed, fixture, placeholder, screenshot ou exemplo usar somente:

```text
TESTE
```

Qualquer nome real ainda existente no DEMO deve ser removido antes de publicação externa.

---

## 18. Testes RC2 — estado confirmado

Executados novamente em 06/09/2026:

```bash
python3 tests/baseline_check.py
python3 tests/static_check.py
python3 tests/rc_check.py
node tests/smoke.js
node --check app.js
node --check data.js
node --check sw.js
```

Resultado:

```text
PASS
```

### Baseline

```text
tabelas:    34
views:      12
funções:    11
triggers:    9
RLS:        34
```

### Premium

```text
SQLs:                              15
novas tabelas:                     22
novas tabelas com RLS:             27/27
novas tabelas com policies:        27/27
views Premium security_invoker:     7
```

### Smoke financeiro DEMO

```text
Orçamento Original:   R$ 100,0 mi
Orçamento Atual:      R$ 105,0 mi
Comprometido:         R$ 72,0 mi
Medido:               R$ 38,0 mi
Custos diretos:        R$ 4,0 mi
Valor apropriado:     R$ 76,0 mi
Saldo disponível:     R$ 29,0 mi
Pago:                 R$ 31,4 mi
Forecast:            R$ 102,8 mi
```

Rateio multi-EAP: PASS.

---

## 19. Riscos conhecidos do V1

Ainda existem em produção porque as migrations Premium não foram aplicadas:

- `auth_all` amplo;
- grants excessivos;
- funções internas executáveis;
- `eh_gestor()` sem distinção global/local;
- frontend V1 sem filtro RBAC;
- constraint de perfis V1 com apenas cinco papéis;
- Técnico/Analista ainda ausentes do constraint V1;
- `ajuda_custo.valor_mensal` exposto em `vw_efetivo`;
- alertas de índices em alguns FKs;
- proteção contra senhas vazadas estava desativada.

---

## 20. Ajuda de custo — ponto pendente

Separar antes de usuários reais com confidencialidade financeira:

```text
regime operacional / viagem
```

de:

```text
valor financeiro da ajuda
```

O valor deve pertencer ao domínio Custos.

---

## 21. Protocolo de colaboração

### Jonacir
Product Owner e autoridade final de negócio.

### ChatGPT
Arquitetura, auditoria, segurança, banco, documentação, testes e continuidade.

### Claude
Implementação, refatoração, UI, migrations e testes.

Nenhuma IA inventa regra de negócio.

Alterações críticas devem ser revisadas por outra IA quando possível.

---

## 22. Restrições atuais

- não gerar custo adicional sem aprovação explícita;
- preferir homologação local/gratuita;
- preservar V1;
- não aplicar Premium em produção agora;
- não usar nomes reais em testes;
- não afirmar publicação sem verificar;
- não depender de conversa como única documentação.

---

## 23. Próximo passo canônico

A próxima fase é **homologação real local e gratuita**, não mais desenho conceitual.

Sequência:

1. subir ambiente Supabase/PostgreSQL local compatível;
2. aplicar `00_v1_schema_baseline.sql`;
3. aplicar migrations 01 → 14;
4. carregar somente dados artificiais `TESTE`;
5. executar `tests/VALIDACAO_POS_HOMOLOGACAO.sql`;
6. criar usuários artificiais de Obra A e Obra B;
7. testar isolamento multiobra;
8. testar todos os papéis;
9. testar especialidades;
10. testar formulário público;
11. testar aprovação de orçamento;
12. testar contrato e compromisso;
13. testar aditivo/supressão;
14. testar medição;
15. testar NF/custo/pagamento;
16. validar anti-dupla-contagem;
17. corrigir problemas;
18. somente depois preparar implantação produtiva.

Critério:

```text
schema sobe do zero
+ migrations aplicam em ordem
+ RLS positivo passa
+ RLS negativo bloqueia
+ workflows passam
+ motor financeiro fecha
+ frontend respeita RBAC
+ V1 sem regressão
+ documentação atualizada
= candidato à produção
```

---

# RESUMO EXECUTIVO DO ESTADO

```text
V1 produção:                  INTACTO
Supabase produção:            INTACTO
Premium V2.1 RC2:             CONSTRUÍDO LOCALMENTE
Git local:                    branch main / LIMPO
GitHub remoto RC2:            NÃO SINCRONIZADO
Baseline V1:                  CONCLUÍDO
Migrations candidatas:        16 SQLs
Testes RC2:                   PASS
Homologação real das SQLs:    PENDENTE
Produção Premium:             NÃO AUTORIZADA / NÃO EXECUTADA
Próxima fase:                 HOMOLOGAÇÃO LOCAL GRATUITA
```

---

## 24. Atualização — kit de homologação local preparado

Em 06/09/2026 foi preparado o kit executável para homologação local gratuita:

```text
scripts/preparar_homologacao_local.sh
scripts/criar_usuarios_teste.sh
tests/seed_homologacao.sql
tests/pgtap/001_estrutura.test.sql
tests/pgtap/002_rls.test.sql
tests/pgtap/003_financeiro.test.sql
docs/HOMOLOGACAO_LOCAL_MAC.md
```

O seed utiliza exclusivamente:

```text
TESTE-A
TESTE-B
```

e usuários `@teste.local`.

### Cobertura preparada

- reconstrução das 16 migrations em Supabase local;
- 27 tabelas Premium e RLS;
- ausência de `auth_all`;
- grants mínimos para `anon` nos objetos Premium;
- `security_invoker` nas views Premium;
- proprietário global;
- isolamento Gestor A × TESTE-B;
- Engenheiro comum sem NF;
- Técnico sem Medições;
- Administrativo com NF e sem Medições;
- especialidade Medições/Custos;
- orçamento R$ 100 mi;
- contrato aprovado R$ 12 mi;
- saldo R$ 88 mi;
- medição R$ 3 mi sem liberação de orçamento;
- aditivo R$ 2 mi recalculando compromisso para R$ 14 mi;
- valor apropriado sem dupla contagem.

### Correção preventiva encontrada

A Migration 06 criava um trigger para atribuir `contrato_itens.valor_total`.
Essa coluna já é `GENERATED ALWAYS` no baseline V1, portanto o trigger foi removido.
A Migration 12 também foi limpa da referência residual à função removida.

Foi acrescentado teste estático para impedir nova escrita em colunas geradas.

### Estado de execução

```text
kit local:                         PREPARADO
shell syntax:                      PASS
testes estáticos/financeiros:      PASS
Supabase/PostgreSQL local real:    NÃO EXECUTADO NESTA SESSÃO
motivo:                            ambiente sem Supabase CLI/Docker/PostgreSQL
Supabase produção:                 INTACTO
```

O próximo gate continua sendo executar `./scripts/preparar_homologacao_local.sh`
em uma máquina com Supabase CLI e runtime Docker-compatible, e somente considerar
as migrations homologadas após `supabase test db` passar de verdade.

---

## Atualização — kit de homologação em 1 clique

Adicionado à RC2:

```text
HOMOLOGAR_BUILDLY.command
scripts/verificar_ambiente_mac.sh
scripts/homologar_local_completo.sh
docs/HOMOLOGACAO_1_CLIQUE_MAC.md
```

Estado validado nesta sessão:

```text
Sintaxe bash dos scripts: PASS
Ausência de supabase link/db push/project ref P3 no launcher: PASS
Comportamento fail-safe sem Docker/Supabase CLI: PASS
Homologação PostgreSQL/Supabase real: ainda pendente em um Mac com pré-requisitos
Produção P3: intacta
```

Somente considerar a RC2 homologada após o relatório local indicar `PASS`.

## 24. Pacote de produção preparado

Foi criado um pacote produtivo **somente de preparação**, sem qualquer write no Supabase P3.

Estado somente leitura confirmado em 06/09/2026:

```text
public tables: 34
public views: 12
migrations históricas: 37
obras: 2 / ativas: 2
perfis ativos: 1
gestor ativo sem obra: 1
colisões com nomes Premium: 0
```

Arquivos novos:

```text
production/PREFLIGHT_PRODUCAO_READONLY.sql
production/SMOKE_POS_DEPLOY_READONLY.sql
production/PLANO_IMPLANTACAO_PRODUCAO_RC2.md
production/GO_NO_GO_PRODUCAO.md
operations/BOOTSTRAP_PROPRIETARIO_GLOBAL.sql
```

Regra crítica:

- `00_v1_schema_baseline.sql` é somente para banco novo/local;
- produção existente começa em `01_seguranca.sql`;
- após `01`, executar bootstrap do proprietário global;
- somente depois continuar para RLS multiobra;
- nenhum artefato novo executa deploy remoto automaticamente.

Próxima autorização necessária:

**homologação local real PASS antes de qualquer implantação em produção.**



## 25. Auditoria final de compatibilidade pré-homologação

Foi executada nova auditoria somente leitura contra o snapshot atual do P3.

Confirmado em 06/09/2026:

```text
private schema:                  AUSENTE
colunas Premium já presentes:   0
contratos_comerciais:           0 registros
contrato_itens:                 0 registros
medicoes:                       0 registros
medicao_itens:                  0 registros
nfs:                            0 registros
nf_itens:                       0 registros
perfis ativos sem obra:         1
gestores ativos sem obra:       1
```

O pre-flight de produção foi corrigido para listar exatamente as **27 tabelas Premium realmente criadas** pelas migrations. Três nomes conceituais antigos foram removidos do checker e substituídos pelos nomes físicos reais.

Foi criado:

```text
production/AUDITORIA_COMPATIBILIDADE_MIGRATIONS_RC2.md
```

Novo teste automático compara a lista do pre-flight com todos os `CREATE TABLE public...` das migrations. Se os dois divergirem, a suíte falha.

Também foi sanitizado o DEMO: obra, fornecedores, códigos documentais e empresas de exemplo agora usam somente nomenclatura `TESTE`. Foi adicionado teste para impedir retorno de nomes reais ao DEMO e aos exemplos visuais.

### Dependência operacional crítica

As migrations 06/13 criam workflows que consultam permissões `aprovar`; a matriz complementar dessas ações é consolidada em 12. Portanto o deploy 01→14 deve acontecer em **janela única de manutenção, sem usuários operando entre migrations**.

Estado após auditoria:

```text
compatibilidade estática P3:       FAVORÁVEL
pre-flight corrigido:              PASS
demo sanitizado:                   PASS
suíte completa:                    PASS
homologação Supabase local real:   PENDENTE
produção alterada:                 NÃO
GO produção:                       NÃO
```

Tag local estável desta auditoria:

```text
v2.2.0-fc1-preflight-auditado
```


## 26. Standalone offline integrado ao pacote canônico

Em 07/09/2026 foi corrigida a dependência indevida do Service Worker na edição standalone.

Estado canônico:

```text
BUILDLy_Premium_V2_STANDALONE.html         = OFFLINE
BUILDLy_Premium_V2_STANDALONE_OFFLINE.html = OFFLINE
ABRIR_BUILDLY_OFFLINE.command               = launcher macOS local
index.html + sw.js                           = somente fluxo PWA/HTTP
```

O standalone não contém conexão de rede e tem CSP com `connect-src 'none'` e `worker-src 'none'`.

Teste automático novo:

```text
tests/offline_check.py
```

Validações exigidas:

```text
sem registro de Service Worker
sem sw.js
sem URL http/https
sem fetch/XHR
sem WebSocket/EventSource
sem JS/CSS externo
CSP bloqueando rede/workers
```

Motivo: permitir abertura direta no Mac sem depender de `web-sandbox.oaiusercontent.com` nem gerar alerta de rede para `sw.js`.

Produção P3 continua intacta. A homologação real das migrations continua pendente.


## 27. FEATURE COMPLETE / TEST READY — fechamento da construção

Em 07/09/2026 foi encerrada a fase de construção funcional do BUILDLy Premium V2.

Versão congelada para início dos testes:

```text
BUILDLy Premium V2.2.0-fc1
status: FEATURE COMPLETE / TEST READY
```

Último módulo funcional incorporado: **Suprimentos**.

Fluxo:

```text
Solicitação de Compra
→ Cotações
→ Seleção de fornecedor
→ Pedido de Compra
→ Aprovação
→ Comprometimento de verba por EAP × CBS
→ Recebimento
→ Nota Fiscal
→ Realizado/Pagamento
```

A Migration 14 adiciona cinco tabelas:

```text
requisicoes_compra
cotacoes_compra
pedidos_compra
pedido_compra_itens
recebimentos_compra
```

Total estrutural Premium candidato passa de 22 para **27 tabelas**.
Total do pacote SQL passa a **16 arquivos** (`00` baseline + migrations `01..14`).

### Congelamento de escopo

A partir deste marco:

- não criar novos módulos;
- não redesenhar arquitetura sem defeito comprovado;
- não ampliar funcionalidades durante a primeira bateria;
- trabalhar somente com testes, erros, correções e regressão;
- qualquer nova ideia vai para backlog pós-estabilização.

### Estado

```text
construção funcional:          CONCLUÍDA
frontend DEMO:                 FEATURE COMPLETE
standalone offline:            CONCLUÍDO
backend candidato:             00..14 PREPARADO
27 tabelas Premium:            MODELADAS
Suprimentos:                   INTEGRADO
produção P3:                   INTACTA
homologação PostgreSQL real:   PENDENTE
próxima fase:                  TESTES E CORREÇÕES
```

---

# ATUALIZAÇÃO CANÔNICA — 07/09/2026 — V2.2 FEATURE COMPLETE

Esta seção substitui contagens/versões anteriores deste documento quando houver divergência.

```text
versão:                      2.2.0-feature-complete
fase:                        DESENVOLVIMENTO FUNCIONAL CONCLUÍDO
escopo:                      CONGELADO
próxima fase:                TESTES E CORREÇÕES
SQLs de homologação:         16 (00 + 01..14)
tabelas Premium candidatas:  27
Suprimentos:                 CONCLUÍDO NO ESCOPO FC
Brain:                       LOCAL / SEM API EXTERNA / SEM CUSTO
Standalone Mac:              OFFLINE
homologação PostgreSQL:      AINDA NÃO EXECUTADA
produção P3:                 INTACTA
```

A Migration 14 acrescenta solicitação de compra, cotações, pedidos, itens e recebimentos. Pedido aprovado cria compromisso; NF vinculada a item do pedido converte compromisso em realizado sem dupla contagem.

**Regra:** não criar módulo novo antes de finalizar a bateria de testes e correções da V2.2.


## 28. BATERIA DE TESTES 01 — V2.2.0 RC1

Em 07/09/2026 o FC1 entrou oficialmente na fase de testes. Foram encontrados e corrigidos seis grupos de defeitos:

- NF conferida não pode ser paga;
- PC com recebimento parcial não pode fechar como recebido;
- transferências/reclassificações são registradas em duas pernas balanceadas;
- criação direta aprovada foi restringida;
- integridade de medição foi reforçada no backend candidato;
- contrato aprovado na DEMO permanece `aprovado`, sem pular para `ativo`.

Validações locais após correção:

```text
baseline_check.py:       PASS
static_check.py:         PASS
rc_check.py:             PASS
offline_check.py:        PASS
smoke.js:                PASS
business_logic.js:       PASS
JS syntax:               PASS
Chromium DOM/cliques:    PASS
21 módulos:              PASS
console JS:              0 erros
```

Fluxos testados em navegador:

```text
Dashboard → PASS
Transferência orçamentária → PASS
Pedido aprovado → PASS
Recebimento parcial → PASS
NF em aprovação → aprovada → paga → PASS
Apontador sem Orçamento e com RDO → PASS
Persistência DEMO → PASS
```

Pendência que impede declaração de homologado:

```text
Supabase/PostgreSQL local real + pgTAP: PENDENTE
Produção P3: INTACTA
```

Versão corrente: `2.2.0-rc1`.

Documento detalhado: `docs/TESTE_BATERIA_01_RC1.md`.
## Publicação GitHub V2

Destino dedicado: `Jonacir2023/buildly-premium`.

- V1 permanece em `Jonacir2023/buildly`;
- V2 não deve compartilhar raiz/branch com a V1;
- remoto local `github` aponta para `https://github.com/Jonacir2023/buildly-premium.git`;
- criação do repositório remoto depende da conta GitHub, pois a integração atual não expõe ação de criar repositórios novos.

