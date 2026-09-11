-- BUILDLy Premium V2.2 Feature Complete — PRE-FLIGHT DE PRODUÇÃO (SOMENTE LEITURA)
-- Snapshot esperado: P3 antes de qualquer migration Premium.
-- Este script NÃO altera dados nem schema. Ele aborta se o banco divergir
-- do estado auditado em 06/09/2026 e precisar de nova revisão.

do $$
declare
  v_tables integer;
  v_views integer;
  v_migrations integer;
  v_gestores integer;
  v_perfis_sem_obra integer;
  v_collisions integer;
  v_financeiro integer;
  v_private integer;
  v_acesso_global integer;
begin
  select count(*) into v_tables
  from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE';

  select count(*) into v_views
  from information_schema.views
  where table_schema='public';

  select count(*) into v_migrations
  from supabase_migrations.schema_migrations;

  select count(*) into v_gestores
  from public.perfis
  where papel='gestor' and ativo and obra_id is null;

  select count(*) into v_perfis_sem_obra
  from public.perfis
  where ativo and obra_id is null;

  with premium_names(name) as (values
    ('eap_itens'),
    ('cbs_codigos'),
    ('orcamentos'),
    ('orcamento_itens'),
    ('orcamento_alteracoes'),
    ('orcamento_alteracao_itens'),
    ('fornecedores'),
    ('contrato_alteracoes'),
    ('contrato_alteracao_itens'),
    ('compromissos'),
    ('compromisso_itens'),
    ('custos_lancamentos'),
    ('pagamentos'),
    ('forecast_itens'),
    ('planejamento_cronogramas'),
    ('planejamento_atividades'),
    ('planejamento_programacoes'),
    ('planejamento_programacao_itens'),
    ('planejamento_restricoes'),
    ('documento_revisoes'),
    ('documento_workflow'),
    ('auditoria_eventos'),
    ('requisicoes_compra'),
    ('cotacoes_compra'),
    ('pedidos_compra'),
    ('pedido_compra_itens'),
    ('recebimentos_compra'),
    ('rdo_clima_periodos'),
    ('rdo_eventos'),
    ('rdo_assinaturas')
  )
  select count(*) into v_collisions
  from premium_names p
  where exists (
    select 1 from information_schema.tables t
    where t.table_schema='public' and t.table_name=p.name
  );

  select count(*) into v_financeiro
  from (
    select 1 from public.contratos_comerciais limit 1
    union all select 1 from public.contrato_itens limit 1
    union all select 1 from public.medicoes limit 1
    union all select 1 from public.medicao_itens limit 1
    union all select 1 from public.nfs limit 1
    union all select 1 from public.nf_itens limit 1
  ) q;

  select count(*) into v_private
  from information_schema.schemata where schema_name='private';

  select count(*) into v_acesso_global
  from information_schema.columns
  where table_schema='public' and table_name='perfis' and column_name='acesso_global';

  if v_tables <> 34 then
    raise exception 'PRE-FLIGHT FALHOU: esperado 34 tabelas public; encontrado %.', v_tables;
  end if;
  if v_views <> 12 then
    raise exception 'PRE-FLIGHT FALHOU: esperado 12 views public; encontrado %.', v_views;
  end if;
  if v_migrations <> 37 then
    raise exception 'PRE-FLIGHT FALHOU: esperado histórico com 37 migrations; encontrado %.', v_migrations;
  end if;
  if v_gestores <> 1 then
    raise exception 'PRE-FLIGHT FALHOU: esperado 1 gestor ativo sem obra para bootstrap; encontrado %.', v_gestores;
  end if;
  if v_perfis_sem_obra <> 1 then
    raise exception 'PRE-FLIGHT FALHOU: existe perfil ativo sem obra além do proprietário esperado; encontrados % perfis ativos sem obra.', v_perfis_sem_obra;
  end if;
  if v_collisions <> 0 then
    raise exception 'PRE-FLIGHT FALHOU: % nomes de tabelas Premium já existem.', v_collisions;
  end if;
  if v_financeiro <> 0 then
    raise exception 'PRE-FLIGHT FALHOU: tabelas financeiras V1 receberam dados desde a auditoria. Reauditar antes de implantar.';
  end if;
  if v_private <> 0 or v_acesso_global <> 0 then
    raise exception 'PRE-FLIGHT FALHOU: sinais de migration Premium parcial já existem.';
  end if;

  raise notice 'PRE-FLIGHT PASS: banco coincide com o snapshot congelado de 06/09/2026.';
end $$;

-- Evidências complementares, ainda somente leitura.
select
  count(*) as obras_total,
  count(*) filter (where ativa) as obras_ativas
from public.obras;

select
  count(*) as perfis_total,
  count(*) filter (where ativo) as perfis_ativos,
  count(*) filter (where papel='gestor' and ativo and obra_id is null) as gestores_ativos_sem_obra
from public.perfis;

select jobid, schedule, command, active
from cron.job
order by jobid;
