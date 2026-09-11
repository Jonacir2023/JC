-- BUILDLy Premium V2 — Migration 06 (CANDIDATA)
-- Contratos comerciais profissionalizados + fornecedor + alterações contratuais.
begin;

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  email text,
  telefone text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  constraint fornecedores_razao_check check (btrim(razao_social)<>''),
  constraint fornecedores_cnpj_uq unique nulls not distinct (cnpj)
);

alter table public.contratos_comerciais
  add column if not exists fornecedor_id uuid references public.fornecedores(id) on delete restrict,
  add column if not exists objeto text,
  add column if not exists status text not null default 'rascunho',
  add column if not exists data_assinatura date,
  add column if not exists data_inicio date,
  add column if not exists data_fim date,
  add column if not exists moeda text not null default 'BRL',
  add column if not exists retencao_percentual numeric not null default 0,
  add column if not exists reajuste_indice text,
  add column if not exists responsavel text,
  add column if not exists documento_id uuid references public.documentos(id) on delete set null,
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_por uuid references auth.users(id) on delete set null,
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.contratos_comerciais drop constraint if exists contratos_comerciais_status_check;
alter table public.contratos_comerciais add constraint contratos_comerciais_status_check
  check (status in ('rascunho','em_aprovacao','aprovado','ativo','encerrado','cancelado'));
alter table public.contratos_comerciais drop constraint if exists contratos_comerciais_datas_check;
alter table public.contratos_comerciais add constraint contratos_comerciais_datas_check
  check (data_fim is null or data_inicio is null or data_fim>=data_inicio);
alter table public.contratos_comerciais drop constraint if exists contratos_comerciais_retencao_check;
alter table public.contratos_comerciais add constraint contratos_comerciais_retencao_check
  check (retencao_percentual between 0 and 100);

alter table public.contrato_itens
  add column if not exists eap_id uuid references public.eap_itens(id) on delete restrict,
  add column if not exists cbs_id uuid references public.cbs_codigos(id) on delete restrict,
  add column if not exists ativo boolean not null default true;


-- Integridade multiobra dos contratos e itens.
alter table public.contratos_comerciais drop constraint if exists contratos_comerciais_id_obra_uq;
alter table public.contratos_comerciais add constraint contratos_comerciais_id_obra_uq unique (id,obra_id);

alter table public.contrato_itens add column if not exists obra_id uuid;
update public.contrato_itens i set obra_id=c.obra_id
from public.contratos_comerciais c
where c.id=i.contrato_id and i.obra_id is null;
alter table public.contrato_itens alter column obra_id set not null;
alter table public.contrato_itens drop constraint if exists contrato_itens_contrato_id_fkey;
alter table public.contrato_itens drop constraint if exists contrato_itens_contrato_obra_fkey;
alter table public.contrato_itens add constraint contrato_itens_contrato_obra_fkey
  foreign key (contrato_id,obra_id) references public.contratos_comerciais(id,obra_id) on delete restrict;
alter table public.contrato_itens drop constraint if exists contrato_itens_eap_id_fkey;
alter table public.contrato_itens drop constraint if exists contrato_itens_eap_obra_fkey;
alter table public.contrato_itens add constraint contrato_itens_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

create or replace function private.preencher_obra_contrato_item()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid;
begin
  select c.obra_id into v_obra from public.contratos_comerciais c where c.id=new.contrato_id;
  if v_obra is null then raise exception 'Contrato não encontrado.'; end if;
  new.obra_id:=v_obra;
  return new;
end $$;
drop trigger if exists contrato_item_resolve_obra on public.contrato_itens;
create trigger contrato_item_resolve_obra before insert or update of contrato_id on public.contrato_itens
for each row execute function private.preencher_obra_contrato_item();

create or replace function private.validar_contrato_aprovacao()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.status in ('aprovado','ativo','encerrado') and (case when tg_op='INSERT' then true else old.status is distinct from new.status end) then
    if tg_op='INSERT' then raise exception 'Crie o contrato em rascunho, inclua os itens e depois aprove.'; end if;
    if new.status in ('aprovado','ativo') and not (private.usuario_global() or private.tem_permissao('contratos','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar contrato.';
    end if;
    if not exists(select 1 from public.contrato_itens i where i.contrato_id=new.id and i.ativo) then
      raise exception 'Contrato não pode ser aprovado sem itens.';
    end if;
    if exists(select 1 from public.contrato_itens i where i.contrato_id=new.id and i.ativo and (i.eap_id is null or i.cbs_id is null)) then
      raise exception 'Todos os itens ativos do contrato devem estar vinculados a EAP e CBS antes da aprovação.';
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists contrato_valida_aprovacao on public.contratos_comerciais;
drop trigger if exists contrato_valida_aprovacao_insert on public.contratos_comerciais;
create trigger contrato_valida_aprovacao before update of status on public.contratos_comerciais for each row execute function private.validar_contrato_aprovacao();
create trigger contrato_valida_aprovacao_insert before insert on public.contratos_comerciais for each row execute function private.validar_contrato_aprovacao();



create or replace function private.proteger_contrato_aprovado()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status in ('aprovado','ativo','encerrado') then
    if tg_op='DELETE' then raise exception 'Contrato aprovado/ativo/encerrado não pode ser excluído.'; end if;
    if new.status is distinct from old.status then
      if not ((old.status='aprovado' and new.status='ativo') or (old.status='ativo' and new.status='encerrado')) then
        raise exception 'Transição de status contratual não permitida. Use alteração/reversão formal.';
      end if;
      if (to_jsonb(new)-array['status','atualizado_em']::text[]) is distinct from (to_jsonb(old)-array['status','atualizado_em']::text[]) then
        raise exception 'Ao mudar estágio do contrato, outros campos não podem ser alterados.';
      end if;
      return new;
    end if;
    if (to_jsonb(new)-array['atualizado_em']::text[]) is distinct from (to_jsonb(old)-array['atualizado_em']::text[]) then
      raise exception 'Contrato aprovado é imutável. Use aditivo/supressão.';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists contrato_protege_aprovado on public.contratos_comerciais;
create trigger contrato_protege_aprovado before update or delete on public.contratos_comerciais
for each row execute function private.proteger_contrato_aprovado();

-- `contrato_itens.valor_total` já é coluna GENERATED ALWAYS no baseline V1.
-- Não criar trigger para escrever nela: o PostgreSQL calcula automaticamente.
drop trigger if exists contrato_item_calcula_total on public.contrato_itens;
drop function if exists private.calcular_valor_contrato_item();

create index if not exists ix_contrato_itens_eap_cbs on public.contrato_itens(eap_id,cbs_id);
create index if not exists ix_contratos_fornecedor on public.contratos_comerciais(fornecedor_id);
create index if not exists ix_contratos_obra_status on public.contratos_comerciais(obra_id,status);

create table if not exists public.contrato_alteracoes (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  contrato_id uuid not null references public.contratos_comerciais(id) on delete restrict,
  numero integer not null,
  tipo text not null,
  descricao text not null,
  status text not null default 'rascunho',
  valor_delta numeric not null default 0,
  prazo_delta_dias integer not null default 0,
  documento_id uuid references public.documentos(id) on delete set null,
  aprovado_em timestamptz,
  aprovado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  constraint contrato_alt_num_uq unique (contrato_id,numero),
  constraint contrato_alt_tipo_check check (tipo in ('aditivo_valor','supressao','prazo','escopo','reajuste','misto')),
  constraint contrato_alt_status_check check (status in ('rascunho','em_aprovacao','aprovada','rejeitada','cancelada')),
  constraint contrato_alt_aprov_check check (status<>'aprovada' or (aprovado_em is not null and aprovado_por is not null))
);

create table if not exists public.contrato_alteracao_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  alteracao_id uuid not null references public.contrato_alteracoes(id) on delete restrict,
  eap_id uuid not null references public.eap_itens(id) on delete restrict,
  cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
  descricao text,
  valor_delta numeric not null,
  criado_em timestamptz not null default now(),
  constraint contrato_alt_item_delta_check check (valor_delta<>0)
);


-- Aditivo/supressão também é sempre da mesma obra do contrato.
alter table public.contrato_alteracoes drop constraint if exists contrato_alteracoes_id_obra_uq;
alter table public.contrato_alteracoes add constraint contrato_alteracoes_id_obra_uq unique(id,obra_id);
alter table public.contrato_alteracoes drop constraint if exists contrato_alteracoes_contrato_id_fkey;
alter table public.contrato_alteracoes drop constraint if exists contrato_alteracoes_contrato_obra_fkey;
alter table public.contrato_alteracoes add constraint contrato_alteracoes_contrato_obra_fkey
  foreign key (contrato_id,obra_id) references public.contratos_comerciais(id,obra_id) on delete restrict;

alter table public.contrato_alteracao_itens drop constraint if exists contrato_alteracao_itens_alteracao_id_fkey;
alter table public.contrato_alteracao_itens drop constraint if exists contrato_alt_item_alteracao_obra_fkey;
alter table public.contrato_alteracao_itens add constraint contrato_alt_item_alteracao_obra_fkey
  foreign key (alteracao_id,obra_id) references public.contrato_alteracoes(id,obra_id) on delete restrict;
alter table public.contrato_alteracao_itens drop constraint if exists contrato_alteracao_itens_eap_id_fkey;
alter table public.contrato_alteracao_itens drop constraint if exists contrato_alt_item_eap_obra_fkey;
alter table public.contrato_alteracao_itens add constraint contrato_alt_item_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

create or replace function private.preencher_obra_contrato_alteracao()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid;
begin
  select c.obra_id into v_obra from public.contratos_comerciais c where c.id=new.contrato_id;
  if v_obra is null then raise exception 'Contrato não encontrado.'; end if;
  new.obra_id:=v_obra;
  return new;
end $$;
drop trigger if exists contrato_alt_resolve_obra on public.contrato_alteracoes;
create trigger contrato_alt_resolve_obra before insert or update of contrato_id on public.contrato_alteracoes
for each row execute function private.preencher_obra_contrato_alteracao();

create or replace function private.preencher_obra_contrato_alt_item()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid;
begin
  select a.obra_id into v_obra from public.contrato_alteracoes a where a.id=new.alteracao_id;
  if v_obra is null then raise exception 'Alteração contratual não encontrada.'; end if;
  new.obra_id:=v_obra;
  return new;
end $$;
drop trigger if exists contrato_alt_item_resolve_obra on public.contrato_alteracao_itens;
create trigger contrato_alt_item_resolve_obra before insert or update of alteracao_id on public.contrato_alteracao_itens
for each row execute function private.preencher_obra_contrato_alt_item();

create or replace function private.validar_alteracao_contratual_aprovacao()
returns trigger language plpgsql set search_path='' as $$
declare v_soma numeric;
begin
  if new.status='aprovada' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovada' end) then
    if tg_op='INSERT' then raise exception 'Crie a alteração contratual em rascunho, inclua os itens e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('contratos','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar alteração contratual.';
    end if;
    select coalesce(sum(i.valor_delta),0) into v_soma
    from public.contrato_alteracao_itens i where i.alteracao_id=new.id;
    if v_soma is distinct from new.valor_delta then
      raise exception 'Valor do cabeçalho (%) difere da soma dos itens (%).',new.valor_delta,v_soma;
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists contrato_alt_valida_aprovacao on public.contrato_alteracoes;
drop trigger if exists contrato_alt_valida_aprovacao_insert on public.contrato_alteracoes;
create trigger contrato_alt_valida_aprovacao before update of status on public.contrato_alteracoes for each row execute function private.validar_alteracao_contratual_aprovacao();
create trigger contrato_alt_valida_aprovacao_insert before insert on public.contrato_alteracoes for each row execute function private.validar_alteracao_contratual_aprovacao();

create or replace view public.vw_contrato_valor_atual with (security_invoker=true) as
with base as (
  select c.id contrato_id,c.obra_id,coalesce(sum(i.valor_total),0) valor_original
  from public.contratos_comerciais c left join public.contrato_itens i on i.contrato_id=c.id and i.ativo
  group by c.id,c.obra_id
), alt as (
  select a.contrato_id,coalesce(sum(a.valor_delta),0) valor_alteracoes
  from public.contrato_alteracoes a where a.status='aprovada' group by a.contrato_id
)
select b.contrato_id,b.obra_id,b.valor_original,coalesce(a.valor_alteracoes,0) valor_alteracoes,
       b.valor_original+coalesce(a.valor_alteracoes,0) valor_atual
from base b left join alt a on a.contrato_id=b.contrato_id;

alter table public.fornecedores enable row level security;
alter table public.contrato_alteracoes enable row level security;
alter table public.contrato_alteracao_itens enable row level security;

commit;
