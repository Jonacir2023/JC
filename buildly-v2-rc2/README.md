# ESTADO VIGENTE — V2.2.0 RC2 / RDO V1 RECUPERADO

> **07/09/2026:** a avaliação anterior de `FEATURE COMPLETE` foi **revogada** após revisão do usuário. A RC1 preservava amplitude de módulos, mas simplificava funcionalidades operacionais já instituídas no V1. O primeiro módulo recuperado integralmente é o **RDO**. A regra atual é: **nenhum módulo V1 pode regredir na V2**. Produção P3 permanece intocada.

Leia `docs/AUDITORIA_PROFUNDIDADE_V1_V2.md` e `docs/MATRIZ_RDO_RECUPERADO.md`.

---

# BUILDLy Premium V2.2 RC2 — Recuperação de profundidade + testes

**Repositório GitHub dedicado (destino oficial):** `Jonacir2023/buildly-premium`

A V1 permanece isolada em `Jonacir2023/buildly` e não deve receber arquivos da V2.

Plataforma de gestão integrada de obras e Project Controls.

## Entrega

Esta pasta contém uma versão funcional **em modo DEMO**, separada do BUILDLy V1 e do Supabase de produção.

### Abrir agora

Abra `index.html` em um navegador moderno.

Para testar recursos PWA/cache local, prefira servir a pasta:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`.


## Standalone realmente offline

Para abrir diretamente no Mac sem depender da prévia do ChatGPT, use:

```text
BUILDLy_Premium_V2_STANDALONE.html
```

ou o launcher:

```text
ABRIR_BUILDLY_OFFLINE.command
```

O standalone padrão agora é deliberadamente **sem Service Worker e sem rede**. Ele não usa `sw.js`, `fetch`, XHR, WebSocket ou recursos externos e possui CSP com `connect-src 'none'`.

O `index.html` continua sendo a versão para servir por HTTP/hosting e testar PWA/cache com `sw.js`. Portanto:

```text
Standalone local -> sem rede / sem worker
index.html servido -> PWA / sw.js
```

Guia: `docs/OFFLINE_MAC.md`.

## O que funciona no modo demo

- Árvore da Obra estilo Explorer/SAP
- EAP contextual
- troca de perfis / RBAC visual
- Dashboard Executivo
- Orçamento por EAP × CBS
- alterações orçamentárias
- Contratos
- aprovação de contrato com comprometimento imediato
- Medições
- Custos diretos
- Forecast
- Notas Fiscais
- Suprimentos: solicitação → cotação → pedido → recebimento → NF
- Planejamento / avanço / restrições
- RDO
- Documentos
- Tarefas
- Alertas
- Ocorrências
- Reuniões
- Equipamentos
- Efetivo
- Relatórios
- busca global
- layout responsivo
- persistência local da demo
- exportação JSON / restauração da demo
- workflows de aprovação e imutabilidade no pacote SQL

## Motor financeiro demo

Estado inicial validado pelos testes:

- Orçamento original: R$ 100,0 mi
- Alterações aprovadas: R$ 5,0 mi
- Orçamento atual: R$ 105,0 mi
- Comprometido: R$ 72,0 mi
- Medido: R$ 38,0 mi
- Custos diretos: R$ 4,0 mi
- Valor apropriado: R$ 76,0 mi
- Saldo disponível: R$ 29,0 mi
- Pago: R$ 31,4 mi
- Forecast final: R$ 102,8 mi
- Saldo projetado: R$ 2,2 mi

Aprovar o contrato `CT-006` no app aumenta o comprometido imediatamente.

## Estrutura

```text
index.html
styles.css
data.js
app.js
manifest.json
sw.js
config.example.js
sql/
  00 baseline V1 reconstruído
  01 ... 15

docs/
tests/
```

## Banco de dados

A pasta `sql/` contém migrations **candidatas**. Elas não foram aplicadas à produção.

Ordem conceitual:

1. Segurança
2. Hardening
3. RLS multiobra
4. Permissões/especialidades
5. EAP + CBS + Orçamento
6. Contratos Premium
7. Motor de Compromissos
8. Posição Financeira
9. Planejamento
10. Documentos Premium
11. Auditoria
12. RLS dos módulos Premium
13. Workflows financeiros (Medições / NF / Custos / Pagamentos)
14. Suprimentos (Requisição / Cotação / Pedido / Recebimento / NF)

## Importante

O app demo é executável e testável agora. Para uso produtivo com dados reais ainda é obrigatório homologar as migrations em um ambiente seguro, aplicar o backend e trocar a fonte demo (`data.js`) por um adapter Supabase.

Não aplicar o pacote SQL diretamente em produção sem homologação e backup.


## Feature Complete Candidate 2.1

Veja `docs/RELEASE_CANDIDATE_2_1.md` e `docs/CHECKLIST_HOMOLOGACAO.md`.


## Homologação local

Com Supabase CLI e um runtime Docker-compatible já instalados/iniciados:

```bash
./scripts/preparar_homologacao_local.sh
```

O fluxo monta as 16 migrations, recria o banco local, carrega apenas `TESTE-A`/`TESTE-B`, cria usuários artificiais e executa pgTAP + lint. Veja `docs/HOMOLOGACAO_LOCAL_MAC.md`.

## Homologação em 1 clique no macOS

Foi adicionado o launcher:

```text
HOMOLOGAR_BUILDLY.command
```

Ele verifica o ambiente, executa os testes estáticos, sobe o Supabase local, aplica as 16 migrations, cria somente usuários `TESTE`, roda pgTAP/lint e gera relatório em `relatorios-homologacao/`.

O launcher **não instala software automaticamente** e **não contém** `supabase link`, `db push` nem referência ao projeto P3. Se faltar Supabase CLI ou runtime compatível com Docker API, ele para antes de qualquer homologação.

Guia: `docs/HOMOLOGACAO_1_CLIQUE_MAC.md`.

## Pacote de produção preparado

A RC2 contém agora um plano de implantação produtiva **não executado** em `production/`.
O arquivo `00_v1_schema_baseline.sql` continua exclusivo de banco novo/local; produção começa em `01_seguranca.sql` e exige o bootstrap administrativo do proprietário antes do RLS multiobra.


## Auditoria de compatibilidade RC2

Antes de qualquer homologação/deploy, consultar `production/AUDITORIA_COMPATIBILIDADE_MIGRATIONS_RC2.md`.
O pre-flight agora é verificado automaticamente contra as 27 tabelas realmente criadas. O DEMO foi sanitizado para usar somente nomes `TESTE`.

**Produção continua NO-GO até a homologação local real passar.**

## Marco FEATURE COMPLETE / TEST READY — REVOGADO COMO ESTADO ATUAL

A construção funcional foi encerrada na versão **2.2.0-fc1**. O último módulo novo incorporado foi **Suprimentos**, fechando o fluxo:

```text
Solicitação → Cotação → Pedido de Compra → Recebimento → NF
```

Pedido aprovado passa a compor o comprometimento orçamentário por **EAP × CBS**.

A partir deste marco, **não adicionar novos módulos nem ampliar escopo antes da bateria de testes**. A próxima fase é exclusivamente:

```text
TESTAR → registrar falha → corrigir → retestar → regressão
```

Produção continua intacta e a homologação PostgreSQL/Supabase local real continua obrigatória.
