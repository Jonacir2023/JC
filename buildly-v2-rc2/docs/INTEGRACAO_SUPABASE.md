# Integração Supabase — mapa da V2

## Autenticação

Reutilizar `supabase.auth.signInWithPassword`.

Após login:
- contexto do perfil via `vw_meu_contexto_buildly`
- permissões via `vw_minhas_permissoes`
- obras limitadas por RLS

## Mapeamento do frontend demo para o backend

| Frontend | Backend Premium |
|---|---|
| EAP | eap_itens / vw_eap_arvore |
| CBS | cbs_codigos / vw_cbs_arvore |
| Orçamento | orcamentos / orcamento_itens / orcamento_alteracoes |
| Orçamento atual | vw_orcamento_atual |
| Contratos | contratos_comerciais / contrato_itens |
| Aditivos | contrato_alteracoes / contrato_alteracao_itens |
| Compromissos | compromissos / compromisso_itens |
| Posição financeira | vw_posicao_financeira |
| Medições | medicoes / medicao_itens |
| NF | nfs / nf_itens |
| Custos | custos_lancamentos |
| Pagamentos | pagamentos |
| Forecast | forecast_itens |
| Planejamento | planejamento_* |
| Documentos | documentos / documento_revisoes / documento_workflow |
| Auditoria | auditoria_eventos |

## Regra de segurança

O frontend apenas melhora UX. RLS é a autoridade.

Todo teste de permissão deve tentar a mesma operação diretamente pela API para provar que o banco bloqueia o acesso indevido.


## Bootstrap de homologação do zero

Em um Supabase local/ambiente novo:

1. `sql/00_v1_schema_baseline.sql`
2. `sql/01_seguranca.sql`
3. seguir em ordem até `sql/14_suprimentos.sql`
4. executar `tests/baseline_check.py`, `tests/rc_check.py` e `tests/VALIDACAO_POS_HOMOLOGACAO.sql`

O arquivo 00 é snapshot estrutural reconstruído do V1 em 06/09/2026; não é a recuperação do SQL original das 37 migrations.


## Kit automatizado de homologação local

- `scripts/preparar_homologacao_local.sh`
- `scripts/criar_usuarios_teste.sh`
- `tests/seed_homologacao.sql`
- `tests/pgtap/001_estrutura.test.sql`
- `tests/pgtap/002_rls.test.sql`
- `tests/pgtap/003_financeiro.test.sql`

O kit trabalha somente com Supabase local e dados `TESTE`. Não executa `supabase link` nem `db push`.
