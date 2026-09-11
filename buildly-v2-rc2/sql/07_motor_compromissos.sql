-- BUILDLy Premium V2 — Migration 07 (CANDIDATA)
-- Motor de compromissos orçamentários.
begin;

create table if not exists public.compromissos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  origem_tipo text not null,
  origem_id uuid not null,
  descricao text not null,
  status text not null default 'ativo',
  moeda text not null default 'BRL',
  aprovado_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  constraint compromissos_origem_uq unique (origem_tipo,origem_id),
  constraint compromissos_status_check check (status in ('ativo','encerrado','cancelado')),
  constraint compromissos_origem_tipo_check check (origem_tipo in ('contrato','pedido_compra','reserva_manual','locacao','ordem_servico'))
);

create table if not exists public.compromisso_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  compromisso_id uuid not null references public.compromissos(id) on delete restrict,
  eap_id uuid not null references public.eap_itens(id) on delete restrict,
  cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
  origem_item_id uuid,
  descricao text,
  valor_aprovado numeric not null,
  criado_em timestamptz not null default now(),
  constraint compromisso_item_valor_check check (valor_aprovado>=0)
);
create index if not exists ix_compromisso_item_eap_cbs on public.compromisso_itens(obra_id,eap_id,cbs_id);

alter table public.compromissos drop constraint if exists compromissos_id_obra_uq;
alter table public.compromissos add constraint compromissos_id_obra_uq unique(id,obra_id);
alter table public.compromisso_itens drop constraint if exists compromisso_itens_compromisso_id_fkey;
alter table public.compromisso_itens drop constraint if exists compromisso_item_compromisso_obra_fkey;
alter table public.compromisso_itens add constraint compromisso_item_compromisso_obra_fkey
  foreign key (compromisso_id,obra_id) references public.compromissos(id,obra_id) on delete restrict;
alter table public.compromisso_itens drop constraint if exists compromisso_itens_eap_id_fkey;
alter table public.compromisso_itens drop constraint if exists compromisso_item_eap_obra_fkey;
alter table public.compromisso_itens add constraint compromisso_item_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;


create or replace function private.recalcular_compromisso_contrato(p_contrato uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.contratos_comerciais%rowtype; v_comp uuid;
begin
  select * into v from public.contratos_comerciais where id=p_contrato;
  if not found then raise exception 'Contrato não encontrado'; end if;

  if v.tipo<>'empreiteiro' or v.status not in ('aprovado','ativo','encerrado') then
    update public.compromissos set status='cancelado' where origem_tipo='contrato' and origem_id=p_contrato;
    return;
  end if;

  insert into public.compromissos(obra_id,origem_tipo,origem_id,descricao,status,moeda,aprovado_em)
  values(v.obra_id,'contrato',v.id,coalesce(v.numero_contrato,v.nome),'ativo',v.moeda,coalesce(v.aprovado_em,now()))
  on conflict(origem_tipo,origem_id) do update set obra_id=excluded.obra_id,descricao=excluded.descricao,status='ativo',moeda=excluded.moeda
  returning id into v_comp;

  delete from public.compromisso_itens where compromisso_id=v_comp;
  -- Recalcula o compromisso atual por EAP x CBS: baseline + todos os deltas aprovados.
  -- Supressões entram como deltas negativos e reduzem o compromisso sem apagar histórico.
  insert into public.compromisso_itens(obra_id,compromisso_id,eap_id,cbs_id,descricao,valor_aprovado)
  with movimentos as (
    select i.eap_id,i.cbs_id,i.descricao,i.valor_total::numeric valor
    from public.contrato_itens i
    where i.contrato_id=v.id and i.ativo and i.eap_id is not null and i.cbs_id is not null
    union all
    select ai.eap_id,ai.cbs_id,coalesce(ai.descricao,a.descricao),ai.valor_delta
    from public.contrato_alteracoes a
    join public.contrato_alteracao_itens ai on ai.alteracao_id=a.id
    where a.contrato_id=v.id and a.status='aprovada'
  )
  select v.obra_id,v_comp,eap_id,cbs_id,max(descricao),sum(valor)
  from movimentos
  group by eap_id,cbs_id
  having sum(valor)>=0;
end $$;

create or replace function private.trg_compromisso_contrato() returns trigger
language plpgsql security definer set search_path='' as $$ begin perform private.recalcular_compromisso_contrato(new.id); return new; end $$;
drop trigger if exists contrato_sincroniza_compromisso on public.contratos_comerciais;
create trigger contrato_sincroniza_compromisso after insert or update of status,aprovado_em on public.contratos_comerciais
for each row execute function private.trg_compromisso_contrato();

create or replace function private.bloquear_item_contrato_aprovado() returns trigger
language plpgsql set search_path='' as $$
declare s text; cid uuid;
begin
  cid:=case when tg_op='DELETE' then old.contrato_id else new.contrato_id end;
  select status into s from public.contratos_comerciais where id=cid;
  if s in ('aprovado','ativo','encerrado') then
    raise exception 'Itens de contrato aprovado não podem ser alterados diretamente. Use aditivo/supressão.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists contrato_item_bloqueia_aprovado on public.contrato_itens;
create trigger contrato_item_bloqueia_aprovado before insert or update or delete on public.contrato_itens for each row execute function private.bloquear_item_contrato_aprovado();


-- Aditivo aprovado recalcula compromisso imediatamente.
create or replace function private.trg_compromisso_alteracao_contrato()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_contrato uuid;
begin
  v_contrato:=coalesce(new.contrato_id,old.contrato_id);
  perform private.recalcular_compromisso_contrato(v_contrato);
  return coalesce(new,old);
end $$;
drop trigger if exists contrato_alt_sincroniza_compromisso on public.contrato_alteracoes;
create trigger contrato_alt_sincroniza_compromisso
after insert or update of status on public.contrato_alteracoes
for each row execute function private.trg_compromisso_alteracao_contrato();

create or replace function private.bloquear_item_alteracao_aprovada()
returns trigger language plpgsql set search_path='' as $$
declare s text; aid uuid;
begin
  aid:=case when tg_op='DELETE' then old.alteracao_id else new.alteracao_id end;
  select status into s from public.contrato_alteracoes where id=aid;
  if s='aprovada' then
    raise exception 'Itens de alteração contratual aprovada não podem ser alterados. Registre nova alteração/reversão.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists contrato_alt_item_bloqueia_aprovada on public.contrato_alteracao_itens;
create trigger contrato_alt_item_bloqueia_aprovada before insert or update or delete on public.contrato_alteracao_itens
for each row execute function private.bloquear_item_alteracao_aprovada();

create or replace function private.bloquear_cabecalho_alteracao_aprovada()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='aprovada' then
    raise exception 'Alteração contratual aprovada é imutável. Registre nova alteração/reversão.';
  end if;
  return coalesce(new,old);
end $$;
drop trigger if exists contrato_alt_bloqueia_aprovada on public.contrato_alteracoes;
create trigger contrato_alt_bloqueia_aprovada before update or delete on public.contrato_alteracoes
for each row execute function private.bloquear_cabecalho_alteracao_aprovada();

alter table public.compromissos enable row level security;
alter table public.compromisso_itens enable row level security;
commit;
