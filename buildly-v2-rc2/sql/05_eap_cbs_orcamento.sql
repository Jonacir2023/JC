-- BUILDLy Premium V2
-- Migration 05 — EAP + CBS + ORÇAMENTO (CANDIDATA / NÃO APLICADA)
--
-- Objetivo:
-- criar a fundação estrutural do Project Controls financeiro.
--
-- Pré-requisitos conceituais:
-- - Fundação de segurança/RBAC aprovada
-- - nenhuma aplicação direta em produção sem homologação

begin;

-- ============================================================
-- 1. EAP / WBS
-- ============================================================

create table if not exists public.eap_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null,
  pai_id uuid,
  codigo text not null,
  nome text not null,
  tipo text not null default 'pacote',
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint eap_itens_obra_fkey
    foreign key (obra_id)
    references public.obras(id)
    on delete restrict,

  constraint eap_tipo_check
    check (tipo in ('grupo','pacote','entrega','outro')),

  constraint eap_codigo_nao_vazio
    check (btrim(codigo) <> ''),

  constraint eap_nome_nao_vazio
    check (btrim(nome) <> ''),

  constraint eap_nao_pai_de_si
    check (pai_id is null or pai_id <> id),

  constraint eap_codigo_por_obra_uq
    unique (obra_id, codigo),

  constraint eap_id_obra_uq
    unique (id, obra_id)
);

alter table public.eap_itens
  drop constraint if exists eap_pai_mesma_obra_fkey;

alter table public.eap_itens
  add constraint eap_pai_mesma_obra_fkey
  foreign key (pai_id, obra_id)
  references public.eap_itens(id, obra_id)
  on delete restrict
  deferrable initially immediate;

create index if not exists ix_eap_obra_pai
  on public.eap_itens(obra_id, pai_id, ordem);

-- Evita ciclos indiretos na hierarquia.
create or replace function private.validar_eap_hierarquia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pai_id is null then
    return new;
  end if;

  if new.pai_id = new.id then
    raise exception 'Um item da EAP não pode ser pai de si mesmo.';
  end if;

  if tg_op = 'UPDATE' then
    if exists (
      with recursive descendentes as (
        select e.id
        from public.eap_itens e
        where e.pai_id = new.id

        union all

        select e2.id
        from public.eap_itens e2
        join descendentes d on e2.pai_id = d.id
      )
      select 1
      from descendentes
      where id = new.pai_id
    ) then
      raise exception 'A alteração criaria um ciclo na EAP.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists eap_valida_hierarquia on public.eap_itens;
create trigger eap_valida_hierarquia
before insert or update of pai_id
on public.eap_itens
for each row
execute function private.validar_eap_hierarquia();

-- ============================================================
-- 2. CBS / CÓDIGOS DE CUSTO
-- ============================================================

create table if not exists public.cbs_codigos (
  id uuid primary key default gen_random_uuid(),
  pai_id uuid references public.cbs_codigos(id) on delete restrict,
  codigo text not null,
  nome text not null,
  tipo text not null default 'conta',
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint cbs_codigo_uq unique (codigo),
  constraint cbs_codigo_nao_vazio check (btrim(codigo) <> ''),
  constraint cbs_nome_nao_vazio check (btrim(nome) <> ''),
  constraint cbs_tipo_check check (tipo in ('grupo','conta','outro')),
  constraint cbs_nao_pai_de_si check (pai_id is null or pai_id <> id)
);

create index if not exists ix_cbs_pai_ordem
  on public.cbs_codigos(pai_id, ordem);

create or replace function private.validar_cbs_hierarquia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.pai_id is null then
    return new;
  end if;

  if new.pai_id = new.id then
    raise exception 'Um código CBS não pode ser pai de si mesmo.';
  end if;

  if tg_op = 'UPDATE' then
    if exists (
      with recursive descendentes as (
        select c.id
        from public.cbs_codigos c
        where c.pai_id = new.id

        union all

        select c2.id
        from public.cbs_codigos c2
        join descendentes d on c2.pai_id = d.id
      )
      select 1
      from descendentes
      where id = new.pai_id
    ) then
      raise exception 'A alteração criaria um ciclo no CBS.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists cbs_valida_hierarquia on public.cbs_codigos;
create trigger cbs_valida_hierarquia
before insert or update of pai_id
on public.cbs_codigos
for each row
execute function private.validar_cbs_hierarquia();

-- ============================================================
-- 3. ORÇAMENTO MESTRE
-- ============================================================

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null,
  codigo text not null default 'ORC-MESTRE',
  nome text not null default 'Orçamento Mestre',
  moeda text not null default 'BRL',
  data_base date,
  documento_origem_id uuid,
  ativo boolean not null default true,
  status text not null default 'rascunho',
  aprovado_em timestamptz,
  aprovado_por uuid,
  criado_em timestamptz not null default now(),
  criado_por uuid,

  constraint orcamentos_obra_fkey
    foreign key (obra_id)
    references public.obras(id)
    on delete restrict,

  constraint orcamentos_documento_fkey
    foreign key (documento_origem_id)
    references public.documentos(id)
    on delete set null,

  constraint orcamentos_criado_por_fkey
    foreign key (criado_por)
    references auth.users(id)
    on delete set null,

  constraint orcamentos_aprovado_por_fkey
    foreign key (aprovado_por)
    references auth.users(id)
    on delete set null,

  constraint orcamentos_status_check
    check (status in ('rascunho','em_aprovacao','aprovado','arquivado')),

  constraint orcamentos_aprovacao_check
    check (status <> 'aprovado' or (aprovado_em is not null and aprovado_por is not null)),

  constraint orcamentos_codigo_por_obra_uq
    unique (obra_id, codigo),

  constraint orcamentos_id_obra_uq
    unique (id, obra_id),

  constraint orcamento_codigo_nao_vazio
    check (btrim(codigo) <> ''),

  constraint orcamento_nome_nao_vazio
    check (btrim(nome) <> ''),

  constraint orcamento_moeda_check
    check (moeda ~ '^[A-Z]{3}$')
);

create index if not exists ix_orcamentos_obra
  on public.orcamentos(obra_id, ativo);

-- ============================================================
-- 4. BASELINE DO ORÇAMENTO
-- ============================================================

create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null,
  orcamento_id uuid not null,
  eap_id uuid not null,
  cbs_id uuid not null,
  codigo_item text,
  descricao text not null,
  unidade text,
  quantidade numeric,
  valor_unitario numeric,
  valor_base numeric not null,
  ordem integer not null default 0,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),

  constraint orc_item_orcamento_obra_fkey
    foreign key (orcamento_id, obra_id)
    references public.orcamentos(id, obra_id)
    on delete restrict,

  constraint orc_item_eap_obra_fkey
    foreign key (eap_id, obra_id)
    references public.eap_itens(id, obra_id)
    on delete restrict,

  constraint orc_item_cbs_fkey
    foreign key (cbs_id)
    references public.cbs_codigos(id)
    on delete restrict,

  constraint orc_item_valor_base_check
    check (valor_base >= 0),

  constraint orc_item_quantidade_check
    check (quantidade is null or quantidade >= 0),

  constraint orc_item_valor_unitario_check
    check (valor_unitario is null or valor_unitario >= 0),

  constraint orc_item_descricao_check
    check (btrim(descricao) <> '')
);

create index if not exists ix_orc_item_orc_eap_cbs
  on public.orcamento_itens(orcamento_id, eap_id, cbs_id);

create index if not exists ix_orc_item_obra_eap
  on public.orcamento_itens(obra_id, eap_id);


-- Baseline aprovada é imutável: primeiro monta-se o orçamento em rascunho,
-- depois ele é aprovado e passa a ser referência histórica.
create or replace function private.validar_orcamento_aprovacao()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='aprovado' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovado' end) then
    if tg_op='INSERT' then raise exception 'Crie o orçamento em rascunho, inclua os itens e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('orcamento','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar orçamento.';
    end if;
    if not exists(select 1 from public.orcamento_itens i where i.orcamento_id=new.id and i.ativo) then
      raise exception 'Orçamento não pode ser aprovado sem itens.';
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists orcamento_valida_aprovacao on public.orcamentos;
drop trigger if exists orcamento_valida_aprovacao_insert on public.orcamentos;
create trigger orcamento_valida_aprovacao before update of status on public.orcamentos for each row execute function private.validar_orcamento_aprovacao();
create trigger orcamento_valida_aprovacao_insert before insert on public.orcamentos for each row execute function private.validar_orcamento_aprovacao();


create or replace function private.proteger_orcamento_aprovado()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='aprovado' then
    if tg_op='DELETE' then raise exception 'Orçamento aprovado não pode ser excluído.'; end if;
    if new.status='arquivado' then
      if (to_jsonb(new)-array['status','ativo']::text[]) is distinct from (to_jsonb(old)-array['status','ativo']::text[]) then
        raise exception 'Ao arquivar orçamento aprovado, somente status/ativo podem mudar.';
      end if;
      return new;
    end if;
    if to_jsonb(new) is distinct from to_jsonb(old) then
      raise exception 'Orçamento aprovado é imutável. Use alteração orçamentária.';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists orcamento_protege_aprovado on public.orcamentos;
create trigger orcamento_protege_aprovado before update or delete on public.orcamentos
for each row execute function private.proteger_orcamento_aprovado();

create or replace function private.bloquear_item_orcamento_aprovado()
returns trigger language plpgsql set search_path='' as $$
declare s text; oid uuid;
begin
  oid:=case when tg_op='DELETE' then old.orcamento_id else new.orcamento_id end;
  select status into s from public.orcamentos where id=oid;
  if s='aprovado' then
    raise exception 'Baseline aprovada é imutável. Registre alteração orçamentária.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists orc_item_bloqueia_aprovado on public.orcamento_itens;
create trigger orc_item_bloqueia_aprovado before insert or update or delete on public.orcamento_itens
for each row execute function private.bloquear_item_orcamento_aprovado();

-- ============================================================
-- 5. ALTERAÇÕES ORÇAMENTÁRIAS
-- ============================================================

create table if not exists public.orcamento_alteracoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null,
  orcamento_id uuid not null,
  numero integer not null,
  tipo text not null,
  descricao text not null,
  status text not null default 'rascunho',
  data_solicitacao date not null default current_date,
  documento_id uuid,
  aprovado_em timestamptz,
  aprovado_por uuid,
  criado_em timestamptz not null default now(),
  criado_por uuid,

  constraint orc_alt_orcamento_obra_fkey
    foreign key (orcamento_id, obra_id)
    references public.orcamentos(id, obra_id)
    on delete restrict,

  constraint orc_alt_documento_fkey
    foreign key (documento_id)
    references public.documentos(id)
    on delete set null,

  constraint orc_alt_aprovado_por_fkey
    foreign key (aprovado_por)
    references auth.users(id)
    on delete set null,

  constraint orc_alt_criado_por_fkey
    foreign key (criado_por)
    references auth.users(id)
    on delete set null,

  constraint orc_alt_numero_uq
    unique (orcamento_id, numero),

  constraint orc_alt_tipo_check
    check (tipo in (
      'suplementacao',
      'reducao',
      'transferencia',
      'reclassificacao',
      'contingencia',
      'revisao'
    )),

  constraint orc_alt_status_check
    check (status in (
      'rascunho',
      'em_aprovacao',
      'aprovada',
      'rejeitada',
      'cancelada'
    )),

  constraint orc_alt_aprovacao_check
    check (
      status <> 'aprovada'
      or (aprovado_em is not null and aprovado_por is not null)
    ),

  constraint orc_alt_descricao_check
    check (btrim(descricao) <> '')
);

create index if not exists ix_orc_alt_orc_status
  on public.orcamento_alteracoes(orcamento_id, status, numero);

-- ============================================================
-- 6. ITENS DAS ALTERAÇÕES
-- ============================================================

create table if not exists public.orcamento_alteracao_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null,
  alteracao_id uuid not null,
  eap_id uuid not null,
  cbs_id uuid not null,
  descricao text,
  valor_delta numeric not null,
  criado_em timestamptz not null default now(),

  constraint orc_alt_item_alteracao_fkey
    foreign key (alteracao_id)
    references public.orcamento_alteracoes(id)
    on delete restrict,

  constraint orc_alt_item_eap_obra_fkey
    foreign key (eap_id, obra_id)
    references public.eap_itens(id, obra_id)
    on delete restrict,

  constraint orc_alt_item_cbs_fkey
    foreign key (cbs_id)
    references public.cbs_codigos(id)
    on delete restrict,

  constraint orc_alt_item_delta_check
    check (valor_delta <> 0)
);

create index if not exists ix_orc_alt_item_alt
  on public.orcamento_alteracao_itens(alteracao_id);

create index if not exists ix_orc_alt_item_obra_eap_cbs
  on public.orcamento_alteracao_itens(obra_id, eap_id, cbs_id);

-- Garante que o item da alteração tenha a mesma obra do cabeçalho.
create or replace function private.validar_obra_item_alteracao()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_obra uuid;
begin
  select a.obra_id
    into v_obra
  from public.orcamento_alteracoes a
  where a.id = new.alteracao_id;

  if v_obra is null then
    raise exception 'Alteração orçamentária não encontrada.';
  end if;

  if v_obra <> new.obra_id then
    raise exception 'O item da alteração pertence a obra diferente do cabeçalho.';
  end if;

  return new;
end;
$$;

drop trigger if exists orc_alt_item_valida_obra
on public.orcamento_alteracao_itens;

create trigger orc_alt_item_valida_obra
before insert or update of alteracao_id, obra_id
on public.orcamento_alteracao_itens
for each row
execute function private.validar_obra_item_alteracao();


create or replace function private.validar_alteracao_orcamentaria_aprovacao()
returns trigger language plpgsql set search_path='' as $$
declare v_soma numeric;
begin
  if new.status='aprovada' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovada' end) then
    if tg_op='INSERT' then raise exception 'Crie a alteração em rascunho, inclua os itens e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('orcamento','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar alteração orçamentária.';
    end if;
    if not exists(select 1 from public.orcamento_alteracao_itens i where i.alteracao_id=new.id) then
      raise exception 'Alteração orçamentária não pode ser aprovada sem itens.';
    end if;
    select coalesce(sum(i.valor_delta),0) into v_soma
    from public.orcamento_alteracao_itens i where i.alteracao_id=new.id;
    if new.tipo in ('transferencia','reclassificacao') and v_soma<>0 then
      raise exception 'Transferência/reclassificação deve ter soma zero. Soma atual: %',v_soma;
    end if;
    if new.tipo='suplementacao' and v_soma<=0 then
      raise exception 'Suplementação deve aumentar o orçamento.';
    end if;
    if new.tipo='reducao' and v_soma>=0 then
      raise exception 'Redução deve diminuir o orçamento.';
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists orc_alt_valida_aprovacao on public.orcamento_alteracoes;
drop trigger if exists orc_alt_valida_aprovacao_insert on public.orcamento_alteracoes;
create trigger orc_alt_valida_aprovacao before update of status on public.orcamento_alteracoes for each row execute function private.validar_alteracao_orcamentaria_aprovacao();
create trigger orc_alt_valida_aprovacao_insert before insert on public.orcamento_alteracoes for each row execute function private.validar_alteracao_orcamentaria_aprovacao();

create or replace function private.bloquear_orcamento_alteracao_aprovada()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='aprovada' then
    raise exception 'Alteração orçamentária aprovada é imutável. Registre nova alteração/reversão.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists orc_alt_bloqueia_aprovada on public.orcamento_alteracoes;
create trigger orc_alt_bloqueia_aprovada before update or delete on public.orcamento_alteracoes
for each row execute function private.bloquear_orcamento_alteracao_aprovada();

create or replace function private.bloquear_item_orc_alt_aprovada()
returns trigger language plpgsql set search_path='' as $$
declare s text; aid uuid;
begin
  aid:=case when tg_op='DELETE' then old.alteracao_id else new.alteracao_id end;
  select status into s from public.orcamento_alteracoes where id=aid;
  if s='aprovada' then
    raise exception 'Itens de alteração orçamentária aprovada são imutáveis.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists orc_alt_item_bloqueia_aprovada on public.orcamento_alteracao_itens;
create trigger orc_alt_item_bloqueia_aprovada before insert or update or delete on public.orcamento_alteracao_itens
for each row execute function private.bloquear_item_orc_alt_aprovada();

-- ============================================================
-- 7. VIEWS DE ÁRVORE
-- ============================================================

create or replace view public.vw_eap_arvore
with (security_invoker=true)
as
with recursive arvore as (
  select
    e.id,
    e.obra_id,
    e.pai_id,
    e.codigo,
    e.nome,
    e.tipo,
    e.ordem,
    e.ativo,
    1::integer as nivel,
    e.codigo::text as caminho_codigos,
    e.nome::text as caminho_nomes
  from public.eap_itens e
  where e.pai_id is null

  union all

  select
    f.id,
    f.obra_id,
    f.pai_id,
    f.codigo,
    f.nome,
    f.tipo,
    f.ordem,
    f.ativo,
    p.nivel + 1,
    p.caminho_codigos || ' > ' || f.codigo,
    p.caminho_nomes || ' > ' || f.nome
  from public.eap_itens f
  join arvore p
    on p.id = f.pai_id
   and p.obra_id = f.obra_id
)
select *
from arvore;

create or replace view public.vw_cbs_arvore
with (security_invoker=true)
as
with recursive arvore as (
  select
    c.id,
    c.pai_id,
    c.codigo,
    c.nome,
    c.tipo,
    c.ordem,
    c.ativo,
    1::integer as nivel,
    c.codigo::text as caminho_codigos,
    c.nome::text as caminho_nomes
  from public.cbs_codigos c
  where c.pai_id is null

  union all

  select
    f.id,
    f.pai_id,
    f.codigo,
    f.nome,
    f.tipo,
    f.ordem,
    f.ativo,
    p.nivel + 1,
    p.caminho_codigos || ' > ' || f.codigo,
    p.caminho_nomes || ' > ' || f.nome
  from public.cbs_codigos f
  join arvore p on p.id = f.pai_id
)
select *
from arvore;

-- ============================================================
-- 8. VIEWS ORÇAMENTÁRIAS
-- ============================================================

create or replace view public.vw_orcamento_base
with (security_invoker=true)
as
select
  o.id as orcamento_id,
  o.obra_id,
  i.eap_id,
  i.cbs_id,
  sum(i.valor_base) as valor_base
from public.orcamentos o
join public.orcamento_itens i
  on i.orcamento_id = o.id
 and i.obra_id = o.obra_id
where o.ativo
  and o.status='aprovado'
  and i.ativo
group by
  o.id,
  o.obra_id,
  i.eap_id,
  i.cbs_id;

create or replace view public.vw_orcamento_atual
with (security_invoker=true)
as
with base as (
  select
    b.orcamento_id,
    b.obra_id,
    b.eap_id,
    b.cbs_id,
    b.valor_base
  from public.vw_orcamento_base b
),
alteracoes as (
  select
    a.orcamento_id,
    a.obra_id,
    i.eap_id,
    i.cbs_id,
    sum(i.valor_delta) as valor_alteracoes
  from public.orcamento_alteracoes a
  join public.orcamento_alteracao_itens i
    on i.alteracao_id = a.id
   and i.obra_id = a.obra_id
  where a.status = 'aprovada'
  group by
    a.orcamento_id,
    a.obra_id,
    i.eap_id,
    i.cbs_id
),
chaves as (
  select orcamento_id, obra_id, eap_id, cbs_id from base
  union
  select orcamento_id, obra_id, eap_id, cbs_id from alteracoes
)
select
  k.orcamento_id,
  k.obra_id,
  k.eap_id,
  k.cbs_id,
  coalesce(b.valor_base, 0) as valor_base,
  coalesce(a.valor_alteracoes, 0) as valor_alteracoes,
  coalesce(b.valor_base, 0) + coalesce(a.valor_alteracoes, 0) as valor_atual
from chaves k
left join base b
  on b.orcamento_id = k.orcamento_id
 and b.obra_id = k.obra_id
 and b.eap_id = k.eap_id
 and b.cbs_id = k.cbs_id
left join alteracoes a
  on a.orcamento_id = k.orcamento_id
 and a.obra_id = k.obra_id
 and a.eap_id = k.eap_id
 and a.cbs_id = k.cbs_id;

-- ============================================================
-- 9. RLS — ESTRUTURA CONSERVADORA
-- ============================================================

alter table public.eap_itens enable row level security;
alter table public.cbs_codigos enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.orcamento_alteracoes enable row level security;
alter table public.orcamento_alteracao_itens enable row level security;

-- EAP: leitura pela obra; manutenção estrutural por global/gestor.
create policy eap_select_obra
on public.eap_itens
for select to authenticated
using (private.tem_acesso_obra(obra_id));

create policy eap_insert_gestao
on public.eap_itens
for insert to authenticated
with check (
  private.usuario_global()
  or (
    public.eh_gestor()
    and private.tem_acesso_obra(obra_id)
  )
);

create policy eap_update_gestao
on public.eap_itens
for update to authenticated
using (
  private.usuario_global()
  or (
    public.eh_gestor()
    and private.tem_acesso_obra(obra_id)
  )
)
with check (
  private.usuario_global()
  or (
    public.eh_gestor()
    and private.tem_acesso_obra(obra_id)
  )
);

-- Sem DELETE V1: inativar.
-- Política não criada deliberadamente.

-- CBS: catálogo corporativo.
create policy cbs_select_auth
on public.cbs_codigos
for select to authenticated
using (true);

create policy cbs_insert_global
on public.cbs_codigos
for insert to authenticated
with check (private.usuario_global());

create policy cbs_update_global
on public.cbs_codigos
for update to authenticated
using (private.usuario_global())
with check (private.usuario_global());

-- Orçamento: leitura pelo escopo da obra.
create policy orcamentos_select_obra
on public.orcamentos
for select to authenticated
using (private.tem_acesso_obra(obra_id));

create policy orcamento_itens_select_obra
on public.orcamento_itens
for select to authenticated
using (private.tem_acesso_obra(obra_id));

create policy orc_alt_select_obra
on public.orcamento_alteracoes
for select to authenticated
using (private.tem_acesso_obra(obra_id));

create policy orc_alt_itens_select_obra
on public.orcamento_alteracao_itens
for select to authenticated
using (private.tem_acesso_obra(obra_id));

-- Escrita orçamentária ficará para migration específica após aprovar:
-- orcamento.criar / editar / submeter / aprovar / cancelar.
-- Não conceder escrita por simples custos.editar.

commit;
