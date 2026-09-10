-- BUILDLy Premium V2 — Migration 13 (RELEASE CANDIDATE)
-- Workflows de aprovação para medições, NFs, custos e pagamentos.
begin;

-- ============================================================
-- 1. MEDIÇÕES PREMIUM
-- ============================================================
alter table public.medicoes
  add column if not exists obra_id uuid,
  add column if not exists status text not null default 'rascunho',
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_por uuid references auth.users(id) on delete set null,
  add column if not exists atualizado_em timestamptz not null default now();

update public.medicoes m
set obra_id=c.obra_id,
    status=case when m.fechada then 'aprovada' else coalesce(nullif(m.status,''),'rascunho') end
from public.contratos_comerciais c
where c.id=m.contrato_id and (m.obra_id is null or m.fechada);

alter table public.medicoes alter column obra_id set not null;
alter table public.medicoes drop constraint if exists medicoes_status_check;
alter table public.medicoes add constraint medicoes_status_check
  check(status in ('rascunho','em_aprovacao','aprovada','rejeitada','cancelada'));
alter table public.medicoes drop constraint if exists medicoes_id_obra_uq;
alter table public.medicoes add constraint medicoes_id_obra_uq unique(id,obra_id);
alter table public.medicoes drop constraint if exists medicoes_contrato_id_fkey;
alter table public.medicoes drop constraint if exists medicoes_contrato_obra_fkey;
alter table public.medicoes add constraint medicoes_contrato_obra_fkey
  foreign key (contrato_id,obra_id) references public.contratos_comerciais(id,obra_id) on delete restrict;

alter table public.medicao_itens add column if not exists obra_id uuid;
update public.medicao_itens mi set obra_id=m.obra_id
from public.medicoes m where m.id=mi.medicao_id and mi.obra_id is null;
alter table public.medicao_itens alter column obra_id set not null;
alter table public.medicao_itens drop constraint if exists medicao_itens_medicao_id_fkey;
alter table public.medicao_itens drop constraint if exists medicao_item_medicao_obra_fkey;
alter table public.medicao_itens add constraint medicao_item_medicao_obra_fkey
  foreign key (medicao_id,obra_id) references public.medicoes(id,obra_id) on delete restrict;

create or replace function private.preencher_obra_medicao()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid;
begin
  select c.obra_id into v_obra from public.contratos_comerciais c where c.id=new.contrato_id;
  if v_obra is null then raise exception 'Contrato da medição não encontrado.'; end if;
  new.obra_id:=v_obra;
  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists medicao_resolve_obra on public.medicoes;
create trigger medicao_resolve_obra before insert or update of contrato_id on public.medicoes
for each row execute function private.preencher_obra_medicao();

create or replace function private.preencher_obra_medicao_item()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid;
begin
  select m.obra_id into v_obra from public.medicoes m where m.id=new.medicao_id;
  if v_obra is null then raise exception 'Medição não encontrada.'; end if;
  new.obra_id:=v_obra;
  return new;
end $$;
drop trigger if exists medicao_item_resolve_obra on public.medicao_itens;
create trigger medicao_item_resolve_obra before insert or update of medicao_id on public.medicao_itens
for each row execute function private.preencher_obra_medicao_item();

-- Integridade de medição: o item deve pertencer ao mesmo contrato e a soma das
-- quantidades em medições não rejeitadas/canceladas não pode ultrapassar o contratado.
create or replace function private.validar_integridade_medicao_item()
returns trigger language plpgsql set search_path='' as $$
declare
  v_contrato_medicao uuid;
  v_status_medicao text;
  v_contrato_item uuid;
  v_quantidade_contratada numeric;
  v_quantidade_reservada numeric;
begin
  select m.contrato_id,m.status into v_contrato_medicao,v_status_medicao
  from public.medicoes m where m.id=new.medicao_id;
  if v_contrato_medicao is null then raise exception 'Medição não encontrada.'; end if;

  select i.contrato_id,i.quantidade into v_contrato_item,v_quantidade_contratada
  from public.contrato_itens i where i.id=new.item_id;
  if v_contrato_item is null then raise exception 'Item contratual não encontrado.'; end if;
  if v_contrato_item<>v_contrato_medicao then
    raise exception 'Item de medição pertence a contrato diferente do boletim.';
  end if;

  select coalesce(sum(mi.quantidade),0) into v_quantidade_reservada
  from public.medicao_itens mi
  join public.medicoes m on m.id=mi.medicao_id
  where mi.item_id=new.item_id
    and mi.id<>new.id
    and m.status not in ('rejeitada','cancelada');

  if v_quantidade_reservada+new.quantidade>v_quantidade_contratada+0.0005 then
    raise exception 'Quantidade medida acumulada ultrapassa a quantidade contratada.';
  end if;
  return new;
end $$;
drop trigger if exists medicao_item_valida_integridade on public.medicao_itens;
create trigger medicao_item_valida_integridade
before insert or update of medicao_id,item_id,quantidade on public.medicao_itens
for each row execute function private.validar_integridade_medicao_item();

create or replace function private.controlar_aprovacao_medicao()
returns trigger language plpgsql set search_path='' as $$
begin
  if (new.status='aprovada' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovada' end))
     or (new.fechada=true and (case when tg_op='INSERT' then true else old.fechada=false end)) then
    if tg_op='INSERT' then raise exception 'Crie a medição em rascunho, inclua os itens e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('medicoes','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar medição.';
    end if;
    if not exists(
      select 1 from public.contratos_comerciais c
      where c.id=new.contrato_id and c.obra_id=new.obra_id and c.status in ('aprovado','ativo')
    ) then
      raise exception 'Somente contrato aprovado/ativo pode receber medição aprovada.';
    end if;
    if not exists(
      select 1 from public.medicao_itens i where i.medicao_id=new.id and i.quantidade>0
    ) then
      raise exception 'Medição não pode ser aprovada sem itens medidos.';
    end if;
    new.status:='aprovada';
    new.fechada:=true;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  if tg_op='UPDATE' and old.status='aprovada' and new.status is distinct from old.status then
    raise exception 'Medição aprovada não pode ser reaberta. Registre correção/reversão auditável.';
  end if;
  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists medicao_controla_aprovacao on public.medicoes;
drop trigger if exists medicao_controla_aprovacao_insert on public.medicoes;
create trigger medicao_controla_aprovacao before update of status,fechada on public.medicoes for each row execute function private.controlar_aprovacao_medicao();
create trigger medicao_controla_aprovacao_insert before insert on public.medicoes for each row execute function private.controlar_aprovacao_medicao();


create or replace function private.proteger_medicao_aprovada()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status='aprovada' then
    if tg_op='DELETE' then raise exception 'Medição aprovada não pode ser excluída.'; end if;
    if to_jsonb(new) is distinct from to_jsonb(old) then
      raise exception 'Medição aprovada é imutável. Registre correção/reversão.';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists medicao_protege_aprovada on public.medicoes;
create trigger medicao_protege_aprovada before update or delete on public.medicoes
for each row execute function private.proteger_medicao_aprovada();

create or replace function private.bloquear_item_medicao_aprovada()
returns trigger language plpgsql set search_path='' as $$
declare s text; mid uuid;
begin
  mid:=case when tg_op='DELETE' then old.medicao_id else new.medicao_id end;
  select status into s from public.medicoes where id=mid;
  if s='aprovada' then raise exception 'Itens de medição aprovada são imutáveis.'; end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists medicao_item_bloqueia_aprovada on public.medicao_itens;
create trigger medicao_item_bloqueia_aprovada before insert or update or delete on public.medicao_itens
for each row execute function private.bloquear_item_medicao_aprovada();

-- ============================================================
-- 2. NOTAS FISCAIS PREMIUM
-- ============================================================
alter table public.nfs
  add column if not exists status text not null default 'rascunho',
  add column if not exists origem_tipo text,
  add column if not exists origem_id uuid,
  add column if not exists contrato_id uuid,
  add column if not exists medicao_id uuid,
  add column if not exists vencimento date,
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_por uuid references auth.users(id) on delete set null,
  add column if not exists atualizado_em timestamptz not null default now();

alter table public.nfs drop constraint if exists nfs_status_check;
alter table public.nfs add constraint nfs_status_check
  check(status in ('rascunho','conferida','aprovada','rejeitada','paga','cancelada'));
alter table public.nfs drop constraint if exists nfs_origem_tipo_check;
alter table public.nfs add constraint nfs_origem_tipo_check
  check(origem_tipo is null or origem_tipo in ('medicao','contrato','pedido_compra','custo_direto','outro'));
alter table public.nfs drop constraint if exists nfs_contrato_obra_fkey;
alter table public.nfs add constraint nfs_contrato_obra_fkey
  foreign key (contrato_id,obra_id) references public.contratos_comerciais(id,obra_id) on delete restrict;
alter table public.nfs drop constraint if exists nfs_medicao_obra_fkey;
alter table public.nfs add constraint nfs_medicao_obra_fkey
  foreign key (medicao_id,obra_id) references public.medicoes(id,obra_id) on delete restrict;

create or replace function private.validar_nf_origem()
returns trigger language plpgsql set search_path='' as $$
declare v_contrato uuid;
begin
  if new.medicao_id is not null then
    select m.contrato_id into v_contrato from public.medicoes m where m.id=new.medicao_id and m.obra_id=new.obra_id;
    if v_contrato is null then raise exception 'Medição da NF não pertence à obra.'; end if;
    if new.contrato_id is null then new.contrato_id:=v_contrato; end if;
    if new.contrato_id<>v_contrato then raise exception 'Contrato da NF difere do contrato da medição.'; end if;
    new.origem_tipo:='medicao'; new.origem_id:=new.medicao_id;
  elsif new.contrato_id is not null and new.origem_tipo is null then
    new.origem_tipo:='contrato'; new.origem_id:=new.contrato_id;
  end if;
  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists nf_valida_origem on public.nfs;
create trigger nf_valida_origem before insert or update of obra_id,contrato_id,medicao_id,origem_tipo,origem_id on public.nfs
for each row execute function private.validar_nf_origem();

create or replace function private.controlar_status_nf()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='aprovada' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovada' end) then
    if tg_op='INSERT' then raise exception 'Crie a NF em rascunho, inclua os itens e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('nfs','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar nota fiscal.';
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  elsif tg_op='UPDATE' and new.status='paga' and old.status is distinct from 'paga' then
    if old.status<>'aprovada' then raise exception 'Somente NF aprovada pode ser marcada como paga.'; end if;
    if not (private.usuario_global() or private.tem_permissao('custos','aprovar')) then
      raise exception 'Seu perfil não possui permissão para registrar pagamento.';
    end if;
    if coalesce((select sum(p.valor) from public.pagamentos p where p.obra_id=new.obra_id and p.origem_tipo='nf' and p.origem_id=new.id and p.status='pago'),0) < new.total then
      raise exception 'NF somente pode ser marcada como paga quando pagamentos quitarem o valor total.';
    end if;
  end if;
  if tg_op='UPDATE' and old.status in ('aprovada','paga') and new.status not in (old.status,'paga') then
    raise exception 'NF aprovada/paga não pode retornar para estágio anterior.';
  end if;
  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists nf_controla_status on public.nfs;
drop trigger if exists nf_controla_status_insert on public.nfs;
create trigger nf_controla_status before update of status on public.nfs for each row execute function private.controlar_status_nf();
create trigger nf_controla_status_insert before insert on public.nfs for each row execute function private.controlar_status_nf();


create or replace function private.proteger_nf_aprovada()
returns trigger language plpgsql set search_path='' as $$
begin
  if old.status in ('aprovada','paga') then
    if tg_op='DELETE' then raise exception 'NF aprovada/paga não pode ser excluída.'; end if;
    if (to_jsonb(new)-array['status','atualizado_em']::text[]) is distinct from (to_jsonb(old)-array['status','atualizado_em']::text[]) then
      raise exception 'Dados de NF aprovada/paga são imutáveis.';
    end if;
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists nf_protege_aprovada on public.nfs;
create trigger nf_protege_aprovada before update or delete on public.nfs
for each row execute function private.proteger_nf_aprovada();

-- ============================================================
-- 3. CUSTOS DIRETOS APROVADOS SÃO IMUTÁVEIS
-- ============================================================
alter table public.custos_lancamentos
  add column if not exists aprovado_em timestamptz,
  add column if not exists aprovado_por uuid references auth.users(id) on delete set null,
  add column if not exists atualizado_em timestamptz not null default now();

create or replace function private.controlar_custo_aprovacao()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.status='aprovado' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovado' end) then
    if tg_op='INSERT' then raise exception 'Crie o custo em rascunho e depois aprove.'; end if;
    if not (private.usuario_global() or private.tem_permissao('custos','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar custo.';
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;
  if tg_op='UPDATE' and old.status='aprovado' then
    if (to_jsonb(new)-array['atualizado_em']::text[]) is distinct from (to_jsonb(old)-array['atualizado_em']::text[]) then
      raise exception 'Custo aprovado é imutável. Registre estorno/reversão.';
    end if;
  end if;
  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists custo_controla_aprovacao on public.custos_lancamentos;
drop trigger if exists custo_controla_aprovacao_insert on public.custos_lancamentos;
create trigger custo_controla_aprovacao before update on public.custos_lancamentos for each row execute function private.controlar_custo_aprovacao();
create trigger custo_controla_aprovacao_insert before insert on public.custos_lancamentos for each row execute function private.controlar_custo_aprovacao();

-- ============================================================
-- 4. PAGAMENTO DE NF ATUALIZA ESTÁGIO FISCAL
-- ============================================================
alter table public.pagamentos
  add column if not exists documento_id uuid references public.documentos(id) on delete set null,
  add column if not exists criado_por uuid references auth.users(id) on delete set null;


create or replace function private.validar_pagamento_nf()
returns trigger language plpgsql set search_path='' as $$
declare v_total numeric; v_pago numeric;
begin
  if new.origem_tipo='nf' and new.status='pago' then
    select n.total into v_total from public.nfs n where n.id=new.origem_id and n.obra_id=new.obra_id and n.status in ('aprovada','paga');
    if v_total is null then raise exception 'NF aprovada não encontrada para pagamento.'; end if;
    select coalesce(sum(p.valor),0) into v_pago from public.pagamentos p
    where p.obra_id=new.obra_id and p.origem_tipo='nf' and p.origem_id=new.origem_id and p.status='pago'
      and (tg_op='INSERT' or p.id<>new.id);
    if v_pago+new.valor>v_total then raise exception 'Pagamento excede o saldo da NF.'; end if;
  end if;
  return new;
end $$;
drop trigger if exists pagamento_valida_nf on public.pagamentos;
create trigger pagamento_valida_nf before insert or update of valor,status,origem_tipo,origem_id on public.pagamentos
for each row execute function private.validar_pagamento_nf();

create or replace function private.refletir_pagamento_nf()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='pago' and new.origem_tipo='nf' then
    update public.nfs n set status='paga',atualizado_em=now()
    where n.id=new.origem_id and n.obra_id=new.obra_id and n.status='aprovada'
      and coalesce((select sum(p.valor) from public.pagamentos p where p.obra_id=n.obra_id and p.origem_tipo='nf' and p.origem_id=n.id and p.status='pago'),0) >= n.total;
  end if;
  return new;
end $$;
drop trigger if exists pagamento_reflete_nf on public.pagamentos;
create trigger pagamento_reflete_nf after insert or update of status on public.pagamentos
for each row execute function private.refletir_pagamento_nf();

-- ============================================================
-- 5. VIEW FISCAL/FINANCEIRA
-- ============================================================
create or replace view public.vw_nfs_financeiro with (security_invoker=true) as
select
  n.id,n.obra_id,n.numero,n.serie,n.data,n.vencimento,n.fornecedor,n.cnpj_fornecedor,
  n.status,n.total,n.contrato_id,n.medicao_id,n.origem_tipo,n.origem_id,
  coalesce((select sum(p.valor) from public.pagamentos p
            where p.obra_id=n.obra_id and p.origem_tipo='nf' and p.origem_id=n.id and p.status='pago'),0) valor_pago,
  n.total-coalesce((select sum(p.valor) from public.pagamentos p
                    where p.obra_id=n.obra_id and p.origem_tipo='nf' and p.origem_id=n.id and p.status='pago'),0) saldo_pagar
from public.nfs n;

revoke all on public.vw_nfs_financeiro from anon,authenticated;
grant select on public.vw_nfs_financeiro to authenticated;

-- ============================================================
-- 6. FUNÇÕES INTERNAS NÃO DEVEM SER RPC PÚBLICO
-- ============================================================
revoke execute on function private.preencher_obra_medicao() from public,anon,authenticated;
revoke execute on function private.preencher_obra_medicao_item() from public,anon,authenticated;
revoke execute on function private.validar_integridade_medicao_item() from public,anon,authenticated;
revoke execute on function private.controlar_aprovacao_medicao() from public,anon,authenticated;
revoke execute on function private.bloquear_item_medicao_aprovada() from public,anon,authenticated;
revoke execute on function private.proteger_medicao_aprovada() from public,anon,authenticated;
revoke execute on function private.validar_nf_origem() from public,anon,authenticated;
revoke execute on function private.controlar_status_nf() from public,anon,authenticated;
revoke execute on function private.proteger_nf_aprovada() from public,anon,authenticated;
revoke execute on function private.controlar_custo_aprovacao() from public,anon,authenticated;
revoke execute on function private.validar_pagamento_nf() from public,anon,authenticated;
revoke execute on function private.refletir_pagamento_nf() from public,anon,authenticated;

commit;
