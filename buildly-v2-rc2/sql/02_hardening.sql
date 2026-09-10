-- BUILDLy Premium — Migration 02 (CANDIDATA)
-- Hardening de grants e funções existentes.
-- Pré-requisito: Migration 01 validada.
-- Objetivo: reduzir superfície pública sem alterar ainda a segregação RLS por obra.

begin;

-- ============================================================
-- 1. ANON: somente o formulário público de solicitações.
-- ============================================================

revoke all privileges on all tables in schema public from anon;
grant insert on public.solicitacoes to anon;

-- A página pública não usa RPC. Bloquear execução direta das funções do app.
revoke execute on function public.carimbar_atualizacao() from public, anon;
revoke execute on function public.carimbar_conclusao_tarefa() from public, anon;
revoke execute on function public.criar_perfil_do_usuario() from public, anon;
revoke execute on function public.e_chuva(text) from public, anon;
revoke execute on function public.eh_gestor() from public, anon;
revoke execute on function public.gerar_avisos() from public, anon;
revoke execute on function public.limpar_avisos_antigos() from public, anon;
revoke execute on function public.papel_atual() from public, anon;
revoke execute on function public.protege_ultimo_gestor() from public, anon;
revoke execute on function public.recalcular_total_nf() from public, anon;
revoke execute on function public.resolver_obra_da_solicitacao() from public, anon;

-- ============================================================
-- 2. AUTHENTICATED: retirar privilégios de administração de objetos.
-- SELECT/INSERT/UPDATE/DELETE continuam como hoje por enquanto;
-- o CRUD será fechado por módulo nas migrations de RLS seguintes.
-- ============================================================

revoke truncate, references, trigger on all tables in schema public from authenticated;

-- Views são somente leitura.
revoke all privileges on
  public.vw_alertas,
  public.vw_atividade_acumulado,
  public.vw_chuva_mes,
  public.vw_contrato_saldo,
  public.vw_disponibilidade_equipamento,
  public.vw_efetivo,
  public.vw_ficha_epi,
  public.vw_lancamento_financeiro,
  public.vw_medicao_item,
  public.vw_rdo_dia,
  public.vw_rdo_resumo,
  public.vw_status_obra
from authenticated;

grant select on
  public.vw_alertas,
  public.vw_atividade_acumulado,
  public.vw_chuva_mes,
  public.vw_contrato_saldo,
  public.vw_disponibilidade_equipamento,
  public.vw_efetivo,
  public.vw_ficha_epi,
  public.vw_lancamento_financeiro,
  public.vw_medicao_item,
  public.vw_rdo_dia,
  public.vw_rdo_resumo,
  public.vw_status_obra
to authenticated;

-- Funções que o cliente não deve executar diretamente.
revoke execute on function public.carimbar_atualizacao() from authenticated;
revoke execute on function public.carimbar_conclusao_tarefa() from authenticated;
revoke execute on function public.criar_perfil_do_usuario() from authenticated;
revoke execute on function public.gerar_avisos() from authenticated;
revoke execute on function public.limpar_avisos_antigos() from authenticated;
revoke execute on function public.protege_ultimo_gestor() from authenticated;
revoke execute on function public.recalcular_total_nf() from authenticated;
revoke execute on function public.resolver_obra_da_solicitacao() from authenticated;

-- Compatibilidade temporária com policies/helpers atuais.
grant execute on function public.eh_gestor() to authenticated;
grant execute on function public.papel_atual() to authenticated;
grant execute on function public.e_chuva(text) to authenticated;

-- ============================================================
-- 3. Search paths fixos e referências qualificadas.
-- ============================================================

alter function public.carimbar_atualizacao() set search_path = '';
alter function public.carimbar_conclusao_tarefa() set search_path = '';
alter function public.e_chuva(text) set search_path = '';

create or replace function public.criar_perfil_do_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data->>'nome'), ''),
      pg_catalog.split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end
$$;

create or replace function public.eh_gestor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis
    where id = (select auth.uid())
      and papel = 'gestor'
      and ativo
  );
$$;

create or replace function public.papel_atual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select papel
  from public.perfis
  where id = (select auth.uid());
$$;

create or replace function public.protege_ultimo_gestor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.papel = 'gestor'
     and (new.papel is distinct from 'gestor' or new.ativo = false) then
    if not exists (
      select 1
      from public.perfis
      where papel = 'gestor'
        and ativo
        and id <> old.id
    ) then
      raise exception
        'Não dá para tirar o último gestor: a obra ficaria sem quem administra. Promova outra pessoa a gestor antes.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.recalcular_total_nf()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  alvo uuid;
begin
  alvo := coalesce(new.nf_id, old.nf_id);
  update public.nfs
     set total = coalesce(
       (select sum(total_item) from public.nf_itens where nf_id = alvo),
       0
     )
   where id = alvo;
  return coalesce(new, old);
end;
$$;

create or replace function public.resolver_obra_da_solicitacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.obra_codigo := pg_catalog.upper(pg_catalog.btrim(new.obra_codigo));
  select id
    into new.obra_id
    from public.obras
   where pg_catalog.upper(codigo) = new.obra_codigo
     and ativa;

  if new.obra_id is null then
    raise exception 'Obra % não encontrada ou inativa.', new.obra_codigo
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

create or replace function public.limpar_avisos_antigos()
returns integer
language sql
security definer
set search_path = ''
as $$
  with apagados as (
    delete from public.avisos
     where lido_em is not null
       and lido_em < pg_catalog.now() - interval '60 days'
    returning 1
  )
  select count(*)::int from apagados;
$$;

create or replace function public.gerar_avisos()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  antes int;
  depois int;
begin
  select count(*) into antes from public.avisos;

  insert into public.avisos (obra_id, tipo, gravidade, titulo, detalhe, referencia, data_ref)
  select c.obra_id, 'experiencia',
         case when e.venc - current_date <= 3 then 'grave' else 'atencao' end,
         p.nome || ' — experiência vence em ' || pg_catalog.to_char(e.venc, 'DD/MM'),
         f.nome || ' · admitido em ' || pg_catalog.to_char(c.admissao, 'DD/MM/YYYY') ||
           ' · experiência de ' || e.qual || ' dias',
         c.id::text || ':' || e.qual, e.venc
    from public.contratos c
    join public.pessoas p on p.id = c.pessoa_id
    join public.funcoes f on f.id = c.funcao_id
    cross join lateral (values
      ('45', c.fim_experiencia_1), ('90', c.fim_experiencia_2)) as e(qual, venc)
   where c.desligamento is null
     and e.venc between current_date and current_date + 7
  on conflict do nothing;

  insert into public.avisos (obra_id, tipo, gravidade, titulo, detalhe, referencia, data_ref)
  select c.obra_id, 'viagem',
         case when v.proxima_viagem - current_date <= 3 then 'grave' else 'atencao' end,
         v.nome || ' — viagem prevista para ' || pg_catalog.to_char(v.proxima_viagem, 'DD/MM'),
         v.funcao || ' · giro de ' || v.periodicidade_viagem_dias || ' dias',
         c.id::text, v.proxima_viagem
    from public.vw_efetivo v
    join public.contratos c on c.id = v.contrato_id
   where v.proxima_viagem between current_date and current_date + 7
  on conflict do nothing;

  insert into public.avisos (obra_id, tipo, gravidade, titulo, detalhe, referencia, data_ref)
  select t.obra_id, 'tarefa_atrasada',
         case when current_date - t.data_termino > 7 then 'grave' else 'atencao' end,
         'Tarefa atrasada: ' || t.assunto,
         coalesce(nullif(t.responsavel, ''), 'sem responsável') ||
           ' · venceu em ' || pg_catalog.to_char(t.data_termino, 'DD/MM/YYYY'),
         t.id::text, t.data_termino
    from public.tarefas t
   where t.status in ('aberta','em_andamento')
     and t.data_termino is not null
     and t.data_termino < current_date
     and t.obra_id is not null
  on conflict do nothing;

  insert into public.avisos (obra_id, tipo, gravidade, titulo, detalhe, referencia, data_ref)
  select o.id, 'rdo_faltando',
         case when g.n > 3 then 'grave' else 'atencao' end,
         'Sem RDO em ' || pg_catalog.to_char(current_date - g.n, 'DD/MM/YYYY'),
         'Dia sem diário lançado. Dia não lançado não conta em medição nem em pleito.',
         pg_catalog.to_char(current_date - g.n, 'YYYY-MM-DD'), (current_date - g.n)
    from public.obras o
    cross join pg_catalog.generate_series(1, 7) as g(n)
    join lateral (
      select min(r.data) as primeiro
      from public.rdos r
      where r.obra_id = o.id
    ) pr on true
   where o.ativa
     and pr.primeiro is not null
     and (current_date - g.n) >= pr.primeiro
     and not exists (
       select 1
       from public.rdos r
       where r.obra_id = o.id
         and r.data = current_date - g.n
     )
     and extract(isodow from (current_date - g.n)) < 7
  on conflict do nothing;

  insert into public.avisos (obra_id, tipo, gravidade, titulo, detalhe, referencia, data_ref)
  select c.obra_id, 'epi_vencido', 'atencao',
         p.nome || ' — troca de EPI vencida',
         e.nome || ' · entregue em ' || pg_catalog.to_char(ee.data_entrega, 'DD/MM/YYYY') ||
           ' · troca era ' || pg_catalog.to_char(ee.data_entrega + e.validade_uso_dias, 'DD/MM/YYYY'),
         ee.id::text, (ee.data_entrega + e.validade_uso_dias)
    from public.epi_entregas ee
    join public.epis e on e.id = ee.epi_id
    join public.contratos c on c.id = ee.contrato_id
    join public.pessoas p on p.id = c.pessoa_id
   where c.desligamento is null
     and e.validade_uso_dias is not null
     and ee.data_entrega + e.validade_uso_dias < current_date
     and not exists (
       select 1
       from public.epi_entregas ee2
       where ee2.contrato_id = ee.contrato_id
         and ee2.epi_id = ee.epi_id
         and ee2.data_entrega > ee.data_entrega
     )
  on conflict do nothing;

  select count(*) into depois from public.avisos;
  return depois - antes;
end;
$$;

-- Reaplicar grants depois dos CREATE OR REPLACE (mantém intenção explícita).
revoke execute on function public.criar_perfil_do_usuario() from public, anon, authenticated;
revoke execute on function public.gerar_avisos() from public, anon, authenticated;
revoke execute on function public.limpar_avisos_antigos() from public, anon, authenticated;
revoke execute on function public.protege_ultimo_gestor() from public, anon, authenticated;
revoke execute on function public.recalcular_total_nf() from public, anon, authenticated;
revoke execute on function public.resolver_obra_da_solicitacao() from public, anon, authenticated;

revoke execute on function public.eh_gestor() from public, anon;
revoke execute on function public.papel_atual() from public, anon;
revoke execute on function public.e_chuva(text) from public, anon;
grant execute on function public.eh_gestor() to authenticated;
grant execute on function public.papel_atual() to authenticated;
grant execute on function public.e_chuva(text) to authenticated;

-- Defaults mais seguros para novos objetos criados pelo papel que executa esta migration.
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

commit;
