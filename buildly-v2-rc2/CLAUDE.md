# ESTADO VIGENTE — V2.2.0 RC2 / PROFUNDIDADE V1 OBRIGATÓRIA

> **07/09/2026:** a declaração anterior de `FEATURE COMPLETE` foi revogada. A RC1 ficou superficial em funcionalidades que já existiam no V1. O RDO foi recuperado a partir do `rdo.html` instituído e agora possui teste de regressão próprio. **Antes de concluir qualquer outro módulo, compare com o V1 e preserve tudo que já funcionava.** Produção P3 continua intocada.

Leia primeiro `docs/AUDITORIA_PROFUNDIDADE_V1_V2.md`, depois `docs/MATRIZ_RDO_RECUPERADO.md` e `docs/ESTADO_ATUAL.md`.

---

# BUILDLy — instruções oficiais para Claude

> Atualizado em **06/09/2026**. Este arquivo é a passagem de contexto oficial para Claude trabalhar no BUILDLy sem depender de histórico de conversa.

## 0. Regra de ouro

O BUILDLy está sendo construído por **Jonacir + ChatGPT + Claude**.

- **Jonacir**: Product Owner, gestor de obras e autoridade final de regra de negócio.
- **ChatGPT**: arquitetura, auditoria, produto, segurança, banco, integração e continuidade.
- **Claude**: implementação, refatoração, UI, testes e código a partir das regras aprovadas.

Qualquer IA pode revisar o trabalho da outra, mas **nenhuma deve inventar regra de negócio**.

Fluxo obrigatório:

```text
Definir → Projetar → Aprovar → Implementar → Testar → Validar → Documentar → Liberar
```

**Nunca alterar produção por impulso.** Primeiro projeto e teste; depois homologação; só então produção com aprovação explícita de Jonacir.

---

# 1. Estado atual do produto

Existem dois produtos/estados distintos.

## 1.1 BUILDLy V1 — Legacy / produção atual

Repositório GitHub:

```text
https://github.com/Jonacir2023/buildly
branch: main
```

Publicação conhecida:

```text
https://jonacir2023.github.io/buildly/
```

A publicação é GitHub Pages a partir da raiz.

O V1 continua sendo o sistema atual e **não deve ser quebrado para construir o Premium**.

Arquivos principais observados no repositório:

```text
.nojekyll
BRIEFING.md
CLAUDE.md
LEIA-ME.txt
README.md
app.js
estilo.css
index.html
pedido.html
pedido.js
tests-dble.js
verificar.py
```

## 1.2 BUILDLy Premium V2 — novo aplicativo

O Premium é um **novo app**, separado do V1.

Release atual preparada localmente:

```text
produto: BUILDLy Premium V2
versão: 2.2.0-rc1
status: RC1 após Bateria 01 PASS; homologação PostgreSQL ainda pendente
produção alterada: NÃO
```

Diretório de trabalho atual:

```text
buildly-premium-v2/
```

O app já funciona em **modo DEMO**, com motor financeiro e navegação funcional.

A RC2 não deve ser tratada como “produção pronta” até as migrations serem executadas em homologação real e os testes positivos/negativos de RLS serem executados com usuários de obras diferentes.

---

# 2. Regra crítica sobre nomes reais

**Português sempre** — código, comentários, commits, texto de tela e documentação.

## NUNCA usar cliente/obra real em teste ou exemplo

Em teste, seed, fixture, placeholder, screenshot e exemplo usar apenas:

```text
TESTE
```

Não usar nome real de cliente ou obra.

### Atenção especial para a RC2

Alguns protótipos/dados DEMO criados durante o desenvolvimento ainda podem conter nome real de obra em textos demonstrativos.

**Antes de publicar, compartilhar externamente ou transformar a DEMO em fixture oficial, substituir tudo por `TESTE`.**

Isso é bloqueador de publicação.

---

# 3. Não misturar repositórios ou fontes de dados

Este projeto não se liga automaticamente a outros repositórios.

Não usar:

```text
Jonacir2023/JC
repo diario-obras de terceiros
planilhas Google como banco principal
```

Fonte estrutural do projeto:

```text
GitHub + Supabase + documentação versionada
```

Nenhuma decisão essencial pode existir somente em conversa de IA.

---

# 4. Supabase atual

Projeto atual:

```text
nome: P3
project ref: ynmewxemcntafwoipybm
região: sa-east-1
PostgreSQL observado: 17.6.1.166
```

URL conhecida:

```text
https://ynmewxemcntafwoipybm.supabase.co
```

## Produção

**O Supabase de produção NÃO foi alterado pelas migrations Premium.**

Todas as migrations Premium estão candidatas para homologação.

Nunca aplicar o pacote inteiro cegamente em produção.

---

# 5. Continuidade do banco V1

O Supabase possui histórico de **37 migrations** por versão/nome, mas o SQL original dessas migrations não está versionado no GitHub.

Isso era um risco de continuidade.

## Solução RC2

Foi criado:

```text
sql/00_v1_schema_baseline.sql
```

Ele é um **snapshot estrutural reconstruído** do estado V1 observado em 06/09/2026.

Contém:

```text
34 tabelas public
12 views
11 funções public
9 triggers
constraints
índices
RLS
policies
grants observados
```

Não contém dados de negócio.

### Muito importante

Esse arquivo:

- **NÃO é o SQL original das 37 migrations históricas**;
- serve para bootstrap de ambiente **novo/local/homologação**;
- **NUNCA deve ser aplicado sobre a produção existente**.

Sequência de bootstrap de ambiente novo:

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

Total no pacote: **16 arquivos SQL**, contando 00 e as duas etapas 04A/04B.

---

# 6. Testes atuais da RC2

Após correção do teste textual do baseline, os testes abaixo passam localmente:

```bash
python tests/baseline_check.py
python tests/static_check.py
python tests/rc_check.py
node tests/smoke.js
node --check app.js
node --check data.js
node --check sw.js
```

Resultados confirmados:

```text
baseline V1:
  tables: 34
  views: 12
  functions: 11
  triggers: 9
  rls: 34

pacote Premium:
  SQLs: 15
  novas tabelas Premium: 22
  novas tabelas com RLS: 27/27
  novas tabelas cobertas por policies: 27/27
  views Premium security_invoker: 7
```

Smoke financeiro DEMO confirmado:

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

Teste de rateio multi-EAP também passou.

---

# 7. Arquitetura do BUILDLy Premium

Posicionamento do produto:

> **BUILDLy = plataforma brasileira de gestão integrada de obras e Project Controls, conectando campo, planejamento, contratos, custos, documentação e gestão.**

Referências conceituais:

- SAP → disciplina financeira e commitments;
- Primavera Unifier / Primavera Cloud → Project Controls;
- Procore → UX campo/escritório;
- Aconex → documentos, revisões e trilha;
- Viewpoint/CMiC → job costing, frota, materiais e contabilidade de obra.

Não copiar interfaces; usar os conceitos profissionais.

---

# 8. Árvore da Obra — navegação principal

A navegação Premium é hierárquica, estilo Windows Explorer/SAP.

Exemplo conceitual:

```text
OBRA TESTE
├── Dashboard
├── Planejamento
│   ├── Cronograma
│   ├── Avanço físico
│   ├── Curva S
│   ├── Programação quinzenal
│   ├── Programação semanal
│   └── Restrições
├── EAP da Obra
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

A árvore **não é só menu**.

Um nó EAP deve abrir contexto integrado:

```text
Orçamento
CBS
Contratos
Comprometido
Realizado
Saldo
Cronograma
Avanço
RDO
Fotos
Medições
NFs
Documentos
Restrições
Tarefas
```

Breadcrumb obrigatório, por exemplo:

```text
TESTE > EAP > 02 Drenagem > 02.01 Tubulação
```

---

# 9. EAP × CBS

## EAP / WBS

Representa:

```text
onde / o quê da obra
```

Exemplo:

```text
02 Drenagem
├── 02.01 Tubulação
├── 02.02 Caixas
└── 02.03 Dissipadores
```

## CBS

Representa:

```text
natureza do custo
```

Exemplo:

```text
Materiais
Mão de obra
Equipamentos
Subempreiteiros
Combustíveis
Administração local
Viagens
Alojamentos
Água
Energia
Veículos leves
Transporte de pessoal
```

Toda linha financeira relevante deve conseguir responder:

> em qual parte da obra foi gasto e em qual natureza de custo?

Regra:

```text
obra + EAP + CBS + origem + documento + responsável + data
```

---

# 10. Núcleo financeiro — regra mais importante do Premium

O coração do sistema é:

```text
Orçamento
→ Compromissos
→ Realizado
→ Pago
→ Forecast
→ Saldo disponível
```

## Contrato aprovado compromete verba imediatamente

Exemplo:

```text
Orçamento Atual = R$ 100 mi
Contrato aprovado = R$ 12 mi

Comprometido = R$ 12 mi
Saldo disponível = R$ 88 mi
```

Não esperar NF ou pagamento.

## Medição não libera orçamento

Se medir R$ 3 mi daquele contrato:

```text
Realizado = R$ 3 mi
Comprometido restante = R$ 9 mi
Valor apropriado = R$ 12 mi
Saldo disponível = R$ 88 mi
```

O valor apenas muda de estágio.

### Fórmulas

```text
Comprometido Restante
= Compromissos aprovados - realizado vinculado
```

```text
Valor Apropriado
= Realizado + Comprometido Restante + Reservas aprovadas
```

```text
Saldo Disponível
= Orçamento Atual - Valor Apropriado
```

```text
Forecast / EAC
= Realizado + Comprometido Restante + ETC não contratado
```

```text
Saldo Projetado
= Orçamento Atual - Forecast
```

Não fazer dupla contagem de contrato + medição + NF.

---

# 11. Orçamento Premium

O orçamento aprovado é baseline imutável.

Não sobrescrever passado.

Estrutura:

```text
Orçamento Original
+ Alterações Orçamentárias Aprovadas
= Orçamento Atual
```

Alterações possíveis:

```text
suplementação
redução
transferência
reclassificação
contingência
revisão
```

Aprovada = imutável.

Correção deve ocorrer por nova alteração/reversão.

Transferência/reclassificação deve fechar em zero no total quando for apenas redistribuição.

---

# 12. Contratos Premium

Contrato não é apenas PDF.

É entidade estruturada.

Cabeçalho mínimo:

```text
obra
fornecedor
CNPJ
objeto
tipo
status
datas
moeda
valor original
aditivos
supressões
valor atual
retenção
reajuste
responsável
condições de pagamento
documentos
```

Itens devem possuir:

```text
EAP
CBS
unidade
quantidade
preço unitário
valor total
```

Fluxo:

```text
Rascunho
→ Em Aprovação
→ Aprovado/Contratado
→ Ativo
→ Encerrado
```

Alternativa:

```text
Cancelado
```

Somente status aprovado/contratado compromete verba.

Aditivo aprovado aumenta compromisso.

Supressão aprovada libera somente parcela ainda não consumida.

Contrato aprovado fica imutável; mudança é via aditivo/supressão/cancelamento controlado.

---

# 13. Workflows financeiros

Registros críticos **não podem ser criados diretamente já aprovados**.

Devem passar por workflow.

Separar ações:

```text
visualizar
criar
editar
submeter
aprovar
cancelar
```

Não usar simplesmente `custos.editar` para aprovar orçamento/contrato.

Depois de aprovado:

- orçamento → imutável;
- alteração orçamentária → imutável;
- contrato → imutável;
- aditivo → imutável;
- medição → imutável;
- NF aprovada/paga → imutável;
- custo aprovado → imutável.

Correção = nova transação/reversão/estorno.

Pagamento parcial não quita automaticamente NF.

Pagamento acima do saldo deve ser bloqueado.

---

# 14. Planejamento Premium

Fluxo:

```text
Cronograma Base oficial
→ Cronograma de Controle
→ Programação Quinzenal
→ Programação Semanal
→ Execução / RDO
→ Avanço Real
```

Planejamento deve possuir:

```text
cronograma
planejado × realizado
avanço físico
marcos
restrições
reprogramações
programação semanal
programação quinzenal
Curva S
PPC
```

Futuro:

```text
PV / EV / AC
CPI / SPI
EAC
```

RDO deve alimentar progresso real, evitando duplicação de lançamento.

---

# 15. Documentos / GED

Documentos Premium devem possuir registro e revisão.

Exemplo:

```text
TESTE-CIV-DRG-00125
Rev.03
Aprovado para Construção
```

Status sugeridos:

```text
Enviado
Em Revisão
Comentado
Aprovado
Aprovado com Comentários
Rejeitado
Obsoleto/Substituído
```

Guardar:

```text
código
tipo
disciplina
revisão
status
emissor
data
responsável
workflow
histórico
```

Não apagar trilha de versão.

---

# 16. Segurança e RBAC

Princípio:

```text
acesso à obra ≠ permissão de módulo/operação
```

Segurança deve considerar:

```text
papel × obra × módulo × operação × especialidade
```

## Proprietário global

Jonacir:

- todas as obras;
- todos os módulos;
- todas as operações.

Não hardcodar nome/email se puder ser evitado.

Use um mecanismo estável de acesso global.

## Gestor da obra

- tudo dentro da própria obra;
- nunca acessar outra obra.

## Papéis base

```text
gestor
engenheiro
tecnico
analista
encarregado
apontador
administrativo
```

## Especialidades

Não criar dezenas de papéis.

Usar papel + especialidade:

```text
engenheiro + medicoes_custos
engenheiro + planejamento
```

Um usuário pode possuir ambas.

---

# 17. Matriz funcional aprovada

## Engenheiro base

```text
RDO           V/C/E/X
Cadastro      V/C/E/X
Alertas       V
Ocorrências   V/C/E/X
Tarefas       V/C/E
NFs           bloqueado sem especialidade
Medições      V/C/E
Reuniões      V/C/E
Relatórios    V/G
Documentos    V/C/E
```

Exclusão explicitamente aprovada para Engenheiro:

```text
RDO
Cadastro
Ocorrências
```

## Encarregado

```text
RDO
Cadastro
```

Todo o restante bloqueado.

## Apontador

Idêntico ao Encarregado.

## Técnico

```text
RDO
Cadastro
Alertas
Ocorrências
Tarefas
```

## Analista

Idêntico ao Técnico nesta versão.

## Administrativo

```text
RDO
Cadastro
Alertas
Ocorrências
Tarefas
Notas Fiscais
Custos
```

Sem:

```text
Medições
Reuniões
Relatórios
Documentos
Planejamento
```

## Engenheiro Medições/Custos

Engenheiro base +:

```text
NFs
Custos
```

Participa do controle financeiro com Administrativo.

## Engenheiro Planejamento

Engenheiro base +:

```text
Planejamento
```

---

# 18. Cadastro local × catálogo corporativo

Não confundir.

## Cadastro da obra

Exemplos:

```text
pessoas
contratos de pessoal
equipamentos da obra
entregas de EPI
```

## Catálogos corporativos

```text
atividades
EPIs
funções
EPI × função
CBS
```

Catálogo compartilhado não pode ser alterado por usuário local apenas porque possui acesso ao módulo Cadastro.

Na V1:

- `atividades` é global;
- `epis` é global;
- `funcoes` é global;
- `epi_funcao` é global.

A manutenção estrutural deve ser restrita.

---

# 19. Regras V1 que continuam válidas

## Colunas calculadas — nunca escrever pelo app

```text
contratos.ativo = desligamento is null
contratos.fim_experiencia_1 = admissao + 45
contratos.fim_experiencia_2 = admissao + 90
```

## Ocorrências

`ocorrencias` no V1 não possui `obra_id`.

Ela pertence à obra por:

```text
contrato_id
ou
rdo_id
```

`chk_ocorrencia_vinculo` exige ao menos um.

## Views com código da obra

Views V1 como:

```text
vw_efetivo
vw_alertas
vw_rdo_resumo
```

expõem o **código** da obra na coluna `obra`.

Filtrar por nome da obra pode retornar vazio sem erro.

## Número de RDO

`rdos.numero` não é automático.

O V1 calcula `max + 1` por obra e trata conflito de unique.

## Atividades

`atividades` é catálogo global.

O RDO copia:

```text
descricao
local
unidade
```

mais `atividade_id`.

Alterar catálogo depois não pode reescrever diário antigo.

Atividade sai de uso por:

```text
ativo=false
```

não por delete.

## Frota

Na V1, `equipamentos.obra_id` indica onde o equipamento está naquele momento.

A frota é compartilhada e pode se mover entre obras.

## EPI

`epi_funcao` liga EPI às funções.

Entrega de EPI é fato real; nunca marcar automaticamente como entregue.

## PDF / emissão

No V1, PDF passa por `emitirFolha()` e grava evidência em `emissoes`.

Nova emissão deve manter a lógica de rastreabilidade.

---

# 20. Dado derivado pertence ao banco

Não recalcular no browser aquilo que deve ser autoridade central.

V1:

```text
nfs.total                  trigger nf_itens_recalcula
nf_itens.total_item        coluna calculada
contrato_itens.valor_total coluna calculada
tarefas.concluido_em       trigger tarefas_conclusao
medição acumulada          vw_medicao_item
lançamento financeiro      vw_lancamento_financeiro
saldo contratual           vw_contrato_saldo
```

Premium deve manter a mesma filosofia.

Dashboard não é fonte da verdade.

---

# 21. Data e timezone

Fuso oficial operacional:

```text
America/Sao_Paulo
```

Não confiar no relógio/configuração do aparelho para determinar o dia do RDO.

Testes de data devem considerar esse timezone.

---

# 22. Persistência no navegador

V1 usa prefixo:

```text
p3::
```

O Premium não deve colidir com V1.

Usar prefixo específico V2, por exemplo:

```text
buildly-v2::
```

Não guardar dados sensíveis no localStorage.

Modo DEMO da RC2 possui persistência local e permite:

```text
Exportar Demo em JSON
Restaurar base Demo
```

Isso não substitui Supabase.

---

# 23. Escrita anônima

Único fluxo público legado:

```text
solicitacoes
```

Sem login:

```text
INSERT apenas
```

Sem SELECT/UPDATE/DELETE.

Qualquer nova entrada pública deve usar caixa de entrada/triagem, nunca gravar diretamente na entidade definitiva.

---

# 24. Situação de segurança observada no V1

O V1 possui RLS nas tabelas, mas foram observadas policies permissivas `auth_all` e grants excessivos, inclusive para `anon`.

Isso é uma das razões das migrations:

```text
01_seguranca
02_hardening
03_rls_multiobra
04a_permissoes
04b_rbac
12_rls_premium
```

Não assumir que “RLS habilitado” significa “seguro”.

Verificar simultaneamente:

```text
grants
policies
views
funções SECURITY DEFINER
RPCs
escopo da obra
permissão da operação
```

---

# 25. SECURITY DEFINER

Preferência arquitetural:

- funções privilegiadas devem ficar fora do schema público exposto;
- manter em schema privado quando possível;
- revogar EXECUTE desnecessário;
- definir `search_path` seguro;
- views públicas devem usar `security_invoker=true` quando apropriado.

Na RC Premium, evitar criar novas funções `SECURITY DEFINER` diretamente em `public` sem justificativa explícita.

---

# 26. Views e RLS

Views Premium devem respeitar RLS das tabelas-base.

Usar:

```sql
with (security_invoker=true)
```

A suíte RC atualmente verifica 7 views Premium assim configuradas.

---

# 27. Auditoria

Fatos financeiros e documentais aprovados devem ser auditáveis.

Registrar quando aplicável:

```text
quem
quando
obra
entidade
operação
antes
depois
origem
documento
motivo
```

Não apagar histórico aprovado.

---

# 28. Estado do frontend Premium RC2

O aplicativo Demo possui:

```text
Árvore da Obra
EAP/WBS contextual
CBS
Dashboard Executivo
Planejamento
Orçamento
Contratos
Comprometimento automático DEMO
Medições
Custos diretos
Notas Fiscais
Forecast
RDO
Documentos
Tarefas
Alertas
Ocorrências
Reuniões
Equipamentos
Efetivo
Relatórios
RBAC demonstrável por perfil
persistência local
exportação/restauração Demo
```

Arquivo standalone:

```text
BUILDLy_Premium_V2_STANDALONE.html
```

Arquivos principais:

```text
index.html
app.js
data.js
styles.css
manifest.json
sw.js
config.example.js
```

Modo DEMO funciona sem aplicar migrations ao Supabase.

---

# 29. O que ainda NÃO está concluído

Não confundir Release Candidate com produção.

Ainda falta, antes de produção Premium:

1. subir ambiente local/homologação compatível com Supabase;
2. aplicar baseline 00 em banco novo;
3. aplicar migrations 01–14 na ordem;
4. executar `tests/VALIDACAO_POS_HOMOLOGACAO.sql`;
5. criar usuários artificiais Obra A / Obra B;
6. executar testes positivos e negativos de RLS;
7. validar formulário público de solicitação;
8. validar triggers/RPCs/workflows;
9. conectar frontend RC ao Supabase homologado;
10. substituir qualquer nome real existente na Demo por `TESTE`;
11. homologação funcional por Jonacir;
12. somente depois planejar migração/produção.

---

# 30. Matriz de testes de segurança obrigatória

Criar em homologação:

```text
Obra TESTE_A
Obra TESTE_B
```

Usuários artificiais:

```text
proprietario_global
gestor_A
gestor_B
engenheiro_A
tecnico_A
analista_A
encarregado_A
apontador_A
administrativo_A
eng_medicoes_A
eng_planejamento_A
eng_completo_A
```

Para cada um validar:

```text
SELECT permitido
SELECT proibido
INSERT permitido
INSERT proibido
UPDATE permitido
UPDATE proibido
DELETE permitido
DELETE proibido
troca manual de obra_id
FK pai apontando para outra obra
tentativa via API mesmo com botão escondido
```

Critério:

> usuário da Obra A jamais acessa dado da Obra B.

Frontend esconder botão é UX, **não segurança**.

---

# 31. GitHub — bloqueio atual

O conector GitHub consegue ler o repositório, mas tentativas de escrita retornaram:

```text
403 Resource not accessible by integration
```

Já falharam anteriormente:

```text
criar arquivo
criar issue
criar branch
```

Não ficar repetindo tentativas em loop.

Enquanto isso, a continuidade Premium está preservada em repositório Git local/bundle.

Estado local observado antes desta atualização:

```text
último commit local: 9efffe4 BUILDLy Premium V2.2 RC1
RC2 possuía alterações locais ainda não publicadas no GitHub
```

Após alterar arquivos, executar testes e criar commit local antes de gerar novo bundle.

---

# 32. Estrutura recomendada de documentação

```text
docs/
├── ESTADO_ATUAL.md
├── VISAO_PRODUTO.md
├── ARQUITETURA.md
├── BANCO.md
├── MODULOS.md
├── REGRAS_NEGOCIO.md
├── PERMISSOES.md
├── ROADMAP.md
├── HISTORICO.md
└── DECISOES_ARQUITETURAIS.md
```

No pacote V2 já existem documentos específicos de RC, integração, árvore, segurança e núcleo financeiro.

---

# 33. Definition of Done

Nada está “pronto” apenas porque a tela abriu.

```text
regra definida
+ banco correto
+ interface funcionando
+ segurança funcionando
+ testes positivos passando
+ testes negativos bloqueados
+ documentação atualizada
+ sem regressão
= PRONTO
```

---

# 34. Como trabalhar ao receber uma tarefa

Antes de editar:

1. ler este `CLAUDE.md`;
2. ler README/estado atual da RC;
3. identificar se tarefa é V1 ou V2;
4. identificar tabelas/views/functions afetadas;
5. verificar migrations existentes;
6. não mudar produção.

Ao implementar:

1. explicar brevemente a mudança;
2. indicar arquivos/tabelas afetados;
3. se houver banco, criar migration;
4. implementar;
5. rodar testes;
6. fazer teste negativo quando for segurança;
7. atualizar documentação;
8. informar exatamente o que foi e o que não foi aplicado.

Nunca dizer:

```text
“está no ar”
“está em produção”
“foi publicado”
```

sem verificação real.

---

# 35. Prioridade de desenvolvimento a partir daqui

A fundação conceitual está feita.

Ordem recomendada:

## A. Homologação técnica RC2

```text
baseline V1 reconstruído
→ migrations Premium
→ testes SQL/RLS
→ frontend conectado
```

## B. Coração financeiro real

```text
EAP
→ CBS
→ Orçamento
→ Contratos
→ Compromissos
→ Saldo Disponível
```

Primeiro marco real:

```text
Orçamento atual: R$ 100 mi
Aprova contrato: R$ 12 mi
Comprometido: R$ 12 mi
Saldo: R$ 88 mi
```

Depois medir R$ 3 mi e confirmar:

```text
Realizado: R$ 3 mi
Comprometido restante: R$ 9 mi
Saldo continua: R$ 88 mi
```

## C. Planejamento integrado

```text
Cronograma Base
→ Controle
→ Quinzenal
→ Semanal
→ RDO
→ Avanço Real
```

## D. GED / auditoria / dashboards

Depois consolidar qualidade, segurança, suprimentos, frota, mobile/offline e IA.

---

# 36. Uma decisão que Claude não deve mudar sozinho

O Premium foi deliberadamente separado do V1.

Não converter o V1 em V2 por grande refactor direto.

Não apagar o Legacy.

Não trocar o banco produtivo por um modelo novo sem homologação e plano de migração.

A estratégia é:

```text
V1 continua funcionando
+
V2 evolui isoladamente
+
homologação
+
migração controlada
```

Essa decisão é estrutural e só Jonacir pode alterá-la.

---

## Atualização de continuidade — homologação local

Foi preparado um kit local para executar as migrations do zero sem produção:

- `scripts/preparar_homologacao_local.sh`
- `scripts/criar_usuarios_teste.sh`
- `tests/seed_homologacao.sql`
- `tests/pgtap/001_estrutura.test.sql`
- `tests/pgtap/002_rls.test.sql`
- `tests/pgtap/003_financeiro.test.sql`
- `docs/HOMOLOGACAO_LOCAL_MAC.md`

Os testes usam apenas `TESTE-A`, `TESTE-B` e usuários `@teste.local`.

Correção já feita: `contrato_itens.valor_total` é `GENERATED ALWAYS`; a Migration 06
não pode escrevê-la manualmente. O trigger redundante foi removido e a referência
residual na Migration 12 também.

**Não declarar as migrations homologadas ainda.** Nesta sessão não havia Supabase
CLI/runtime Docker/PostgreSQL para executá-las de verdade. Testes estáticos e o
motor financeiro em memória estão PASS; o próximo gate é `supabase test db` local.

Release local estável do kit: `v2.2.0-fc1-homologacao-kit` (criar/usar a tag após commit final).

## Homologação macOS em 1 clique — atualização RC2

Existe agora `HOMOLOGAR_BUILDLY.command` na raiz do pacote V2.

Ele é o caminho preferido para a primeira homologação real em um Mac preparado. O launcher:

- não instala dependências automaticamente;
- não usa `supabase link`;
- não usa `supabase db push`;
- não contém o project ref do P3;
- executa somente stack Supabase local;
- gera relatório PASS/FAIL em `relatorios-homologacao/`.

Arquivos auxiliares:

```text
scripts/verificar_ambiente_mac.sh
scripts/homologar_local_completo.sh
docs/HOMOLOGACAO_1_CLIQUE_MAC.md
```

Não declarar a RC2 "homologada" antes de executar esse fluxo contra Supabase local real e obter PASS.


## Pacote de produção preparado — NÃO executar ainda

Existe agora `production/` com pre-flight, smoke e plano GO/NO-GO, e `operations/BOOTSTRAP_PROPRIETARIO_GLOBAL.sql`.

Regras para Claude:

1. Não rodar `00_v1_schema_baseline.sql` em produção.
2. Produção começa em `01_seguranca.sql`.
3. Depois de `01`, o bootstrap do proprietário global é obrigatório antes do RLS multiobra.
4. Não automatizar `supabase link`, `db push` ou `db reset --linked`.
5. Não escrever no P3 sem autorização explícita do Jonacir e homologação local PASS.
6. Se o pre-flight divergir do snapshot de 06/09/2026, parar e reauditar.



## Auditoria pré-homologação — atualização obrigatória

O arquivo `production/PREFLIGHT_PRODUCAO_READONLY.sql` foi reauditorado e agora sua lista de 27 tabelas Premium é derivada/validada contra os nomes físicos realmente criados pelas migrations.

Não voltar a usar os nomes conceituais antigos `contrato_aditivos`, `forecast_versoes` ou `planejamento_avancos`: eles **não são** tabelas da RC2 atual. Os nomes físicos são, entre outros, `contrato_alteracoes`, `contrato_alteracao_itens`, `forecast_itens` e as cinco tabelas de planejamento efetivamente presentes.

Existe um teste em `tests/static_check.py` que deve falhar se a lista do pre-flight divergir das migrations.

O DEMO também foi sanitizado. `data.js`, o standalone e os exemplos visuais devem usar somente `TESTE` / `FORNECEDOR TESTE`. Não reintroduzir nomes reais em seeds, placeholders, screenshots ou dados demo.

A implantação 01→14 deve ser tratada como **janela única de manutenção**. Não liberar usuários no meio da sequência, pois workflows criados antes da Migration 12 dependem da matriz final de ações `aprovar`.

Documento de referência: `production/AUDITORIA_COMPATIBILIDADE_MIGRATIONS_RC2.md`.


Tag local de referência após esta auditoria: `v2.2.0-fc1-preflight-auditado`.


## Regra obrigatória — standalone offline

A partir de 07/09/2026, `BUILDLy_Premium_V2_STANDALONE.html` é uma edição **100% local/offline**.

Claude não deve reintroduzir no standalone:

- `navigator.serviceWorker.register(...)`;
- referência a `sw.js`;
- `fetch`, XHR, WebSocket ou EventSource;
- scripts/estilos/fontes remotos;
- URLs `http://` ou `https://`;
- qualquer necessidade de `web-sandbox.oaiusercontent.com`.

A versão PWA é `index.html` quando servida por HTTP e pode continuar usando `sw.js`.

Arquivos:

```text
BUILDLy_Premium_V2_STANDALONE.html
BUILDLy_Premium_V2_STANDALONE_OFFLINE.html
ABRIR_BUILDLY_OFFLINE.command
docs/OFFLINE_MAC.md
tests/offline_check.py
```

Antes de qualquer entrega, executar `python3 tests/offline_check.py`.


# 37. CONGELAMENTO FEATURE COMPLETE — HISTÓRICO / REVOGADO COMO ESTADO ATUAL

Em 07/09/2026 Jonacir determinou: **ir até o fim da construção, concluir e depois iniciar testes e correções**.

A fase de construção está encerrada em:

```text
BUILDLy Premium V2.2.0-fc1
FEATURE COMPLETE / TEST READY
```

O último módulo novo é **Suprimentos**, implementado em `sql/14_suprimentos.sql` e no frontend DEMO.

Fluxo oficial:

```text
Solicitação → Cotação → Pedido → Aprovação → Compromisso → Recebimento → NF
```

Pedido aprovado compromete verba por EAP × CBS antes da NF.

O pacote agora possui:

```text
16 SQLs: 00 + 01..14
27 tabelas Premium candidatas
```

## Regra para Claude a partir deste marco

**Não criar funcionalidade nova durante a primeira bateria de testes.**

Trabalhar somente em:

1. reproduzir erro;
2. identificar causa;
3. corrigir com menor alteração possível;
4. executar testes do módulo;
5. executar regressão;
6. atualizar ESTADO_ATUAL se a correção mudar contrato/schema/regra.

Novas ideias devem ir para backlog pós-estabilização, sem entrar no FC1.

Não declarar produção pronta até a homologação real das migrations em Supabase/PostgreSQL local passar.


# 38. BATERIA 01 — CORREÇÕES FC1 → RC1

Em 07/09/2026 a primeira bateria de testes do Feature Complete encontrou e corrigiu:

- pagamento indevido de NF `conferida`;
- recebimento parcial de PC tratado como total;
- transferência/reclassificação orçamentária unilateral;
- criação/aprovação excessivamente permissiva em alguns fluxos;
- falta de validação backend para item/quantidade de medição;
- aprovação de contrato DEMO pulando diretamente para `ativo`.

Regras novas que Claude não pode remover:

1. NF só pode ser paga se estiver `aprovada`.
2. Pagamento exige `custos.aprovar`.
3. PC parcial permanece `parcialmente_recebido` e conserva saldo.
4. Transferência/reclassificação precisa ter saída + entrada balanceadas.
5. Item de medição precisa pertencer ao contrato do boletim.
6. Quantidade medida acumulada não pode ultrapassar a contratada.
7. Medição vazia não é aprovável.
8. Custo não nasce aprovado.
9. Aprovação de contrato leva a `aprovado`; ativação é etapa posterior.

Teste local novo: `tests/business_logic.js`.
Teste pgTAP reforçado: `tests/pgtap/003_financeiro.test.sql`.
Relatório: `docs/TESTE_BATERIA_01_RC1.md`.

Estado da bateria:

```text
21 módulos navegados: PASS
transferência orçamentária: PASS
Suprimentos / PC parcial: PASS
NF aprovação/pagamento: PASS
RBAC visual Apontador: PASS
console JavaScript: 0 erros
pgTAP PostgreSQL real: PENDENTE de Supabase local
```

A versão corrente a partir daqui é `BUILDLy Premium V2.2.0-rc1`.
