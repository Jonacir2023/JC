# BUILDLy Premium V2.2 — Feature Complete

**Versão congelada:** `2.2.0-fc1`  
**Data:** 07/09/2026  
**Estado:** desenvolvimento funcional concluído; próxima fase exclusiva de testes e correções.  
**Produção P3:** não alterada.

## O que significa Feature Complete

Todos os módulos definidos para o primeiro produto Premium já possuem representação funcional no aplicativo local e modelo de banco candidato. A partir deste marco, não serão acrescentados novos módulos antes da bateria de testes. Defeitos, lacunas de regra e ajustes de UX encontrados nos testes serão tratados como correções da mesma versão.

## Escopo funcional congelado

- Dashboard executivo e drill-down financeiro.
- Árvore da Obra estilo Explorer/SAP.
- EAP/WBS hierárquica e gestão da EAP.
- CBS corporativa.
- Orçamento original, alterações, orçamento atual e saldo.
- Contratos de terceiros, itens EAP/CBS, aditivos e supressões.
- Motor de compromissos sem dupla contagem.
- Custos diretos, pagamentos, forecast e saldo projetado.
- Medições e fluxo de aprovação.
- Notas fiscais e pagamento.
- Suprimentos: solicitação, cotação, pedido, recebimento e vínculo com NF.
- Planejamento: cronograma, semanal/PPC, quinzenal, restrições e Curva S.
- RDO.
- GED/documentos e revisões.
- Cadastro, pessoas, efetivo, equipamentos, manutenção, EPI e fornecedores.
- Tarefas em Kanban.
- Ocorrências, alertas e reuniões.
- Relatórios/CSV e impressão.
- Busca global.
- Importação/exportação do estado DEMO.
- RBAC de interface e modelo RBAC/RLS candidato no banco.
- Trilha de auditoria.
- Brain Local: análise determinística dos dados da obra, sem API externa e sem custo.
- Standalone 100% offline para Mac.

## Banco candidato

A cadeia de homologação passa a ter **16 SQLs**:

`00_v1_schema_baseline.sql` + migrations `01` a `14`.

A Migration 14 adiciona o módulo Suprimentos com cinco novas tabelas:

- `requisicoes_compra`
- `cotacoes_compra`
- `pedidos_compra`
- `pedido_compra_itens`
- `recebimentos_compra`

Total de novas tabelas Premium candidatas: **27**.

Pedido de compra aprovado gera compromisso automaticamente. NF vinculada ao pedido e aos seus itens transforma parte do compromisso em realizado sem liberar orçamento indevidamente.

## Brain

O Brain desta versão é **local e determinístico**. Ele calcula alertas e recomendações a partir do estado da obra no próprio navegador. Não chama OpenAI, Claude ou outra API, não envia dados para terceiros e não gera custo adicional.

A integração futura com modelos de IA permanece possível, mas está fora do escopo congelado desta Feature Complete.

## Regra daqui para frente

1. Não adicionar módulo novo.
2. Subir a versão em homologação local Supabase/PostgreSQL.
3. Executar testes de schema, migrations, RLS, RBAC, financeiro, suprimentos e interface.
4. Registrar todos os defeitos encontrados.
5. Corrigir sem ampliar escopo.
6. Repetir a bateria até PASS.
7. Somente então avaliar GO/NO-GO de produção.

## O que ainda NÃO está concluído

Feature Complete não significa homologado nem pronto para produção. Ainda faltam:

- execução real dos 16 SQLs em Supabase local;
- testes pgTAP completos;
- testes de navegador e responsividade;
- testes por perfil e por duas obras;
- validação de todos os workflows financeiros;
- correções decorrentes dos testes;
- implantação controlada em produção.

**Próxima fase oficial: TESTES E CORREÇÕES.**
