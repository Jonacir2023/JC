# BUILDLy Premium V2.2.0 RC1 — Bateria de Testes 01

**Data:** 07/09/2026  
**Origem:** V2.2.0 FC1 / Feature Complete  
**Resultado:** PASS após correções  
**Produção P3:** não alterada

## Defeitos encontrados e corrigidos

1. **NF conferida podia ser paga na DEMO**
   - Correção: pagamento só aparece/é aceito para NF `aprovada`.
   - Permissão de pagamento exige `custos.aprovar`.

2. **Recebimento parcial de Pedido de Compra fechava o pedido como recebido**
   - Correção: saldo recebido é acumulado.
   - Status intermediário: `parcialmente_recebido`.
   - Pedido só vira `recebido` quando o total é atingido.

3. **Alguns fatos podiam nascer diretamente aprovados na DEMO / backend**
   - Contrato e medição não oferecem criação direta aprovada na UI.
   - Custo não pode nascer `aprovado` no workflow SQL.

4. **Transferência/reclassificação orçamentária podia ficar unilateral**
   - Correção: DEMO cria automaticamente saída e entrada com mesmo grupo.
   - Aprovação valida que o grupo esteja balanceado.

5. **Faltava trava forte de integridade de item de medição no backend candidato**
   - Item medido deve pertencer ao mesmo contrato da medição.
   - Quantidade acumulada não pode ultrapassar quantidade contratada.
   - Medição não pode ser aprovada sem item medido.
   - Contrato precisa estar aprovado/ativo para medição aprovada.

6. **Aprovação do contrato na DEMO pulava para `ativo`**
   - Correção: aprovação passa para `aprovado`, mantendo coerência com o workflow do banco.

## Testes automáticos locais

Executados e aprovados:

```text
python3 tests/baseline_check.py      PASS
python3 tests/static_check.py        PASS
python3 tests/rc_check.py            PASS
python3 tests/offline_check.py       PASS
node tests/smoke.js                  PASS
node tests/business_logic.js         PASS
node --check app.js                  PASS
node --check data.js                 PASS
node --check sw.js                   PASS
```

## Teste em Chromium — DOM + cliques + formulários

O ambiente bloqueia navegação `file://` e `localhost` por política administrativa. Para testar a UI real, o HTML foi carregado no DOM do Chromium headless e `data.js` + `app.js` foram executados no contexto da página, com `localStorage` em memória.

Aprovado:

- Dashboard Executivo carregado;
- orçamento atual R$ 105,0 mi;
- navegação em **21 módulos**;
- transferência orçamentária balanceada sem alterar orçamento total;
- Pedido de Compra aprovado antes do recebimento;
- recebimento parcial mantém saldo e status `parcialmente_recebido`;
- NF `conferida` não exibe pagamento;
- nova NF: `em_aprovacao → aprovada → paga`;
- pagamento fecha exatamente o valor da NF;
- persistência DEMO acionada;
- Apontador não visualiza Orçamento;
- Apontador visualiza RDO;
- console: **0 exceções/erros JavaScript**.

## Testes backend adicionados

`tests/pgtap/003_financeiro.test.sql` ganhou casos para:

- custo não nascer aprovado;
- quantidade medida acumulada não exceder contratada;
- item de outro contrato ser bloqueado;
- medição vazia não ser aprovada.

Esses casos estão preparados, mas a execução pgTAP real continua dependente de Supabase/PostgreSQL local.

## Resultado da bateria

```text
Frontend DEMO:           PASS
Motor financeiro local: PASS
Navegação:               PASS
RBAC visual essencial:  PASS
Suprimentos:             PASS
NF/pagamento:            PASS
Standalone offline:      PASS
Console JS:              PASS
PostgreSQL/pgtAP real:   PENDENTE
Produção:                INTACTA
```

## Regra da próxima etapa

Escopo continua congelado. Não criar funcionalidades novas. Próxima bateria deve focar:

1. contratos e aditivos;
2. medições e limites;
3. planejamento/RDO;
4. documentos/revisões;
5. equipamentos/efetivo/cadastro;
6. homologação SQL real no Supabase local.
