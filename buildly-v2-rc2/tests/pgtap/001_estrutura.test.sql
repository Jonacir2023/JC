begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(8);

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r' and c.relname in (
    'eap_itens','cbs_codigos','orcamentos','orcamento_itens','orcamento_alteracoes','orcamento_alteracao_itens',
    'fornecedores','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens',
    'custos_lancamentos','pagamentos','forecast_itens','planejamento_cronogramas','planejamento_atividades',
    'planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documento_revisoes',
    'documento_workflow','auditoria_eventos',
    'requisicoes_compra','cotacoes_compra','pedidos_compra','pedido_compra_itens','recebimentos_compra')),
  27::bigint,'27 tabelas Premium existem');

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='r' and c.relrowsecurity and c.relname in (
    'eap_itens','cbs_codigos','orcamentos','orcamento_itens','orcamento_alteracoes','orcamento_alteracao_itens',
    'fornecedores','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens',
    'custos_lancamentos','pagamentos','forecast_itens','planejamento_cronogramas','planejamento_atividades',
    'planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documento_revisoes',
    'documento_workflow','auditoria_eventos',
    'requisicoes_compra','cotacoes_compra','pedidos_compra','pedido_compra_itens','recebimentos_compra')),
  27::bigint,'27 tabelas Premium têm RLS');

select ok(not exists(
  select 1 from pg_policies where schemaname='public' and policyname='auth_all'
),'auth_all foi eliminado');

select ok(not exists(
  select 1 from information_schema.role_table_grants
  where table_schema='public' and grantee='anon'
    and table_name in ('eap_itens','orcamentos','compromissos','custos_lancamentos','pagamentos','auditoria_eventos')
),'anon não possui grants Premium');

select is(
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='v'
     and c.relname in ('vw_eap_arvore','vw_cbs_arvore','vw_orcamento_base','vw_orcamento_atual','vw_contrato_valor_atual','vw_posicao_financeira','vw_nfs_financeiro')
     and coalesce(array_to_string(c.reloptions,','),'') like '%security_invoker%'),
  7::bigint,'7 views Premium usam security_invoker');

select ok(to_regprocedure('private.tem_acesso_obra(uuid)') is not null,'helper de escopo por obra existe');
select ok(to_regprocedure('private.tem_permissao(text,text)') is not null,'helper de permissão existe');
select ok(to_regclass('public.vw_posicao_financeira') is not null,'view de posição financeira existe');

select * from finish();
rollback;
