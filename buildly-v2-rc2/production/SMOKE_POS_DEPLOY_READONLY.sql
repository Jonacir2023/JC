-- BUILDLy Premium V2.2 Feature Complete — SMOKE ESTRUTURAL PÓS-DEPLOY (SOMENTE LEITURA)
-- Executar depois de 01..14 + bootstrap do proprietário.

do $$
declare
  v_tables integer;
  v_views integer;
  v_global integer;
  v_private integer;
  v_auth_all integer;
  v_premium_rls integer;
  v_premium_policy integer;
  v_security_invoker integer;
  v_anon_danger integer;
begin
  select count(*) into v_tables
  from information_schema.tables
  where table_schema='public' and table_type='BASE TABLE';

  select count(*) into v_views
  from information_schema.views
  where table_schema='public';

  select count(*) into v_global
  from public.perfis
  where ativo and acesso_global=true;

  select count(*) into v_private
  from information_schema.schemata
  where schema_name='private';

  select count(*) into v_auth_all
  from pg_policies
  where schemaname='public' and policyname='auth_all';

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
    ('recebimentos_compra')
  )
  select count(*) into v_premium_rls
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  join premium_names p on p.name=c.relname
  where n.nspname='public' and c.relkind='r' and c.relrowsecurity;

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
    ('recebimentos_compra')
  )
  select count(distinct p.name) into v_premium_policy
  from premium_names p
  join pg_policies x on x.schemaname='public' and x.tablename=p.name;

  select count(*) into v_security_invoker
  from pg_class c
  join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public'
    and c.relkind='v'
    and coalesce(array_to_string(c.reloptions,','),'') like '%security_invoker%';

  select count(*) into v_anon_danger
  from information_schema.role_table_grants
  where grantee='anon'
    and table_schema='public'
    and privilege_type in ('SELECT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER');

  if v_tables <> 61 then
    raise exception 'SMOKE FALHOU: esperado 61 tabelas public; encontrado %.', v_tables;
  end if;
  if v_views < 19 then
    raise exception 'SMOKE FALHOU: esperado pelo menos 19 views public; encontrado %.', v_views;
  end if;
  if v_global <> 1 then
    raise exception 'SMOKE FALHOU: esperado exatamente 1 proprietário global ativo; encontrado %.', v_global;
  end if;
  if v_private <> 1 then
    raise exception 'SMOKE FALHOU: schema private ausente.';
  end if;
  if v_auth_all <> 0 then
    raise exception 'SMOKE FALHOU: ainda existem % policies auth_all.', v_auth_all;
  end if;
  if v_premium_rls <> 27 then
    raise exception 'SMOKE FALHOU: apenas %/27 tabelas Premium estão com RLS.', v_premium_rls;
  end if;
  if v_premium_policy <> 27 then
    raise exception 'SMOKE FALHOU: apenas %/27 tabelas Premium têm policies.', v_premium_policy;
  end if;
  if v_security_invoker < 19 then
    raise exception 'SMOKE FALHOU: esperado security_invoker nas views públicas; encontrado %.', v_security_invoker;
  end if;
  if v_anon_danger <> 0 then
    raise exception 'SMOKE FALHOU: anon ainda possui % privilégios perigosos em public.', v_anon_danger;
  end if;

  raise notice 'SMOKE ESTRUTURAL PASS.';
end $$;

select papel, ativo, obra_id, acesso_global
from public.perfis
order by criado_em;

select tablename, policyname, cmd, roles
from pg_policies
where schemaname='public'
order by tablename, policyname;
