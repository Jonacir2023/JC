# Entrega — BUILDLy Premium V2.1 RC1

Data: 06/09/2026

## O que está entregue

Uma Release Candidate funcional do novo BUILDLy Premium, separada do V1.

### Aplicativo DEMO funcional

- Árvore da Obra estilo Explorer/SAP
- EAP/WBS contextual
- CBS
- Dashboard Executivo
- Planejamento
- Orçamento
- Contratos
- Comprometimento automático no motor DEMO
- Medições
- Custos diretos
- Notas Fiscais
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
- RBAC demonstrável por perfil
- persistência local da demonstração
- exportação JSON e restauração da base DEMO

### Backend candidato

14 migrations ordenadas (01–13, com 04A e 04B):

- segurança e hardening
- RLS multiobra
- RBAC e especialidades
- EAP + CBS + orçamento
- contratos Premium
- motor de compromissos
- posição financeira
- planejamento
- GED
- auditoria
- RLS Premium
- workflows de medições/NFs/custos/pagamentos

## Testes executados nesta entrega

Resultado: PASS

- `python3 tests/static_check.py`
- `python3 tests/rc_check.py`
- `node tests/smoke.js`
- `node --check app.js`
- `node --check data.js`
- `node --check sw.js`
- verificação léxica dos 14 SQLs

Cobertura estrutural verificada:

- 22 novas tabelas Premium
- 22/22 com RLS
- 22/22 com policies
- 7 views Premium com `security_invoker=true`
- nenhuma nova função `SECURITY DEFINER` no schema `public` nas migrations Premium
- motor financeiro DEMO validado
- rateio multi-EAP validado

## Baseline financeiro DEMO

- Orçamento Original: R$ 100,0 mi
- Orçamento Atual: R$ 105,0 mi
- Comprometido: R$ 72,0 mi
- Medido: R$ 38,0 mi
- Custos diretos: R$ 4,0 mi
- Valor apropriado: R$ 76,0 mi
- Saldo disponível: R$ 29,0 mi
- Pago: R$ 31,4 mi
- Forecast: R$ 102,8 mi

## Proteções adicionadas na RC

- baseline aprovada é imutável
- alteração orçamentária aprovada é imutável
- contrato aprovado exige EAP/CBS
- contrato aprovado é imutável; mudanças via aditivo/supressão
- aditivo aprovado recalcula compromisso
- medição aprovada é imutável
- NF aprovada/paga é imutável
- custo aprovado é imutável
- pagamento parcial não quita NF
- pagamento acima do saldo é bloqueado
- tentativa de criar diretamente registros críticos já aprovados é bloqueada
- grants Premium são explícitos

## Estado da produção

**O Supabase de produção NÃO foi alterado.**

A RC está pronta para homologação, não para aplicação cega em produção.

## Artefatos principais

- `BUILDLy_Premium_V2_STANDALONE.html`
- `index.html`
- `sql/`
- `docs/`
- `tests/`
- `RELEASE.json`
- `SHA256SUMS.txt`

Também foi gerado um Git bundle externo para preservar esta versão mesmo com o conector GitHub sem escrita.
