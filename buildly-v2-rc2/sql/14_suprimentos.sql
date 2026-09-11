-- BUILDLy Premium V2.2 — Migration 14 (FEATURE COMPLETE CANDIDATA)
-- Suprimentos: solicitação -> cotação -> pedido -> recebimento -> NF.
-- Pedido aprovado cria compromisso orçamentário por EAP x CBS.
-- Requer migrations 01..13 já aplicadas.
begin;

-- ============================================================
-- 1. MATRIZ DE PERMISSÕES
-- ============================================================
insert into private.papel_permissoes(papel,modulo,acao,permitido) values
  ('gestor','suprimentos','acessar',true),
  ('gestor','suprimentos','visualizar',true),
  ('gestor','suprimentos','criar',true),
  ('gestor','suprimentos','editar',true),
  ('gestor','suprimentos','excluir',true),
  ('gestor','suprimentos','aprovar',true),
  ('administrativo','suprimentos','acessar',true),
  ('administrativo','suprimentos','visualizar',true),
  ('administrativo','suprimentos','criar',true),
  ('administrativo','suprimentos','editar',true)
on conflict(papel,modulo,acao) do update set permitido=excluded.permitido;

-- ============================================================
-- 2. SOLICITAÇÕES DE COMPRA
-- ============================================================
create table if not exists public.requisicoes_compra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  numero text not null,
  eap_id uuid not null,
  cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
  descricao text not null,
  quantidade numeric(14,3) not null default 1,
  unidade text,
  valor_estimado numeric(14,2) not null default 0,
  responsavel text,
  necessidade_em date,
  status text not null default 'rascunho',
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  constraint requisicoes_compra_num_obra_uq unique(obra_id,numero),
  constraint requisicoes_compra_id_obra_uq unique(id,obra_id),
  constraint requisicoes_compra_desc_check check(btrim(descricao)<>''),
  constraint requisicoes_compra_qtd_check check(quantidade>0),
  constraint requisicoes_compra_valor_check check(valor_estimado>=0),
  constraint requisicoes_compra_status_check check(status in ('rascunho','em_cotacao','em_aprovacao','pedido_emitido','cancelada')),
  constraint requisicoes_compra_eap_obra_fkey foreign key(eap_id,obra_id)
    references public.eap_itens(id,obra_id) on delete restrict
);
create index if not exists ix_requisicoes_compra_obra_status on public.requisicoes_compra(obra_id,status,criado_em desc);
create index if not exists ix_requisicoes_compra_eap_cbs on public.requisicoes_compra(obra_id,eap_id,cbs_id);

-- ============================================================
-- 3. COTAÇÕES
-- ============================================================
create table if not exists public.cotacoes_compra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  requisicao_id uuid not null,
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  valor_total numeric(14,2) not null,
  prazo_dias integer,
  condicao_pagamento text,
  validade_ate date,
  selecionada boolean not null default false,
  status text not null default 'recebida',
  observacao text,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  constraint cotacoes_compra_req_fornecedor_uq unique(requisicao_id,fornecedor_id),
  constraint cotacoes_compra_id_obra_uq unique(id,obra_id),
  constraint cotacoes_compra_valor_check check(valor_total>=0),
  constraint cotacoes_compra_prazo_check check(prazo_dias is null or prazo_dias>=0),
  constraint cotacoes_compra_status_check check(status in ('recebida','selecionada','descartada','cancelada')),
  constraint cotacoes_compra_req_obra_fkey foreign key(requisicao_id,obra_id)
    references public.requisicoes_compra(id,obra_id) on delete restrict
);
create unique index if not exists uq_cotacao_selecionada_por_requisicao
  on public.cotacoes_compra(requisicao_id) where selecionada=true;
create index if not exists ix_cotacoes_compra_obra_req on public.cotacoes_compra(obra_id,requisicao_id);

create or replace function private.sincronizar_selecao_cotacao_compra()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.selecionada then
    new.status:='selecionada';
    update public.cotacoes_compra
       set selecionada=false,
           status=case when status='selecionada' then 'recebida' else status end
     where requisicao_id=new.requisicao_id and id<>new.id and selecionada=true;
  elsif new.status='selecionada' then
    new.selecionada:=true;
  end if;
  return new;
end $$;
drop trigger if exists cotacao_compra_sincroniza_selecao on public.cotacoes_compra;
create trigger cotacao_compra_sincroniza_selecao
before insert or update of selecionada,status on public.cotacoes_compra
for each row execute function private.sincronizar_selecao_cotacao_compra();

-- ============================================================
-- 4. PEDIDOS DE COMPRA
-- ============================================================
create table if not exists public.pedidos_compra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  requisicao_id uuid,
  cotacao_id uuid,
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  numero text not null,
  descricao text not null,
  data_emissao date not null default current_date,
  valor_total numeric(14,2) not null default 0,
  moeda text not null default 'BRL',
  condicao_pagamento text,
  status text not null default 'rascunho',
  aprovado_em timestamptz,
  aprovado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_em timestamptz not null default now(),
  constraint pedidos_compra_num_obra_uq unique(obra_id,numero),
  constraint pedidos_compra_id_obra_uq unique(id,obra_id),
  constraint pedidos_compra_desc_check check(btrim(descricao)<>''),
  constraint pedidos_compra_valor_check check(valor_total>=0),
  constraint pedidos_compra_moeda_check check(moeda ~ '^[A-Z]{3}$'),
  constraint pedidos_compra_status_check check(status in ('rascunho','em_aprovacao','aprovado','parcialmente_recebido','recebido','cancelado')),
  constraint pedidos_compra_req_obra_fkey foreign key(requisicao_id,obra_id)
    references public.requisicoes_compra(id,obra_id) on delete restrict,
  constraint pedidos_compra_cot_obra_fkey foreign key(cotacao_id,obra_id)
    references public.cotacoes_compra(id,obra_id) on delete restrict
);
create index if not exists ix_pedidos_compra_obra_status on public.pedidos_compra(obra_id,status,data_emissao desc);
create index if not exists ix_pedidos_compra_fornecedor on public.pedidos_compra(fornecedor_id);

create table if not exists public.pedido_compra_itens (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  pedido_id uuid not null,
  eap_id uuid not null,
  cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
  descricao text not null,
  unidade text,
  quantidade numeric(14,3) not null,
  valor_unitario numeric(14,4) not null,
  valor_total numeric(14,2) generated always as (round(quantidade*valor_unitario,2)) stored,
  criado_em timestamptz not null default now(),
  constraint pedido_compra_itens_id_obra_uq unique(id,obra_id),
  constraint pedido_compra_item_qtd_check check(quantidade>0),
  constraint pedido_compra_item_valor_check check(valor_unitario>=0),
  constraint pedido_compra_item_desc_check check(btrim(descricao)<>''),
  constraint pedido_compra_item_pedido_obra_fkey foreign key(pedido_id,obra_id)
    references public.pedidos_compra(id,obra_id) on delete restrict,
  constraint pedido_compra_item_eap_obra_fkey foreign key(eap_id,obra_id)
    references public.eap_itens(id,obra_id) on delete restrict
);
create index if not exists ix_pedido_compra_itens_pedido on public.pedido_compra_itens(pedido_id);
create index if not exists ix_pedido_compra_itens_eap_cbs on public.pedido_compra_itens(obra_id,eap_id,cbs_id);

-- ============================================================
-- 5. RECEBIMENTOS
-- ============================================================
create table if not exists public.recebimentos_compra (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.obras(id) on delete restrict,
  pedido_id uuid not null,
  data date not null default current_date,
  descricao text not null,
  valor_recebido numeric(14,2) not null,
  recebido_por text,
  status text not null default 'recebido',
  documento_id uuid references public.documentos(id) on delete set null,
  criado_em timestamptz not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  constraint recebimentos_compra_valor_check check(valor_recebido>0),
  constraint recebimentos_compra_status_check check(status in ('recebido','cancelado')),
  constraint recebimentos_compra_pedido_obra_fkey foreign key(pedido_id,obra_id)
    references public.pedidos_compra(id,obra_id) on delete restrict
);
create index if not exists ix_recebimentos_compra_pedido on public.recebimentos_compra(obra_id,pedido_id,data);

-- ============================================================
-- 6. APROVAÇÃO / IMUTABILIDADE DO PEDIDO
-- ============================================================
create or replace function private.controlar_aprovacao_pedido_compra()
returns trigger language plpgsql set search_path='' as $$
declare v_itens numeric; v_count integer; v_tem_movimento boolean;
begin
  if new.status='aprovado' and (case when tg_op='INSERT' then true else old.status is distinct from 'aprovado' end) then
    if tg_op='INSERT' then
      raise exception 'Crie o pedido em rascunho, inclua os itens e depois aprove.';
    end if;
    if not (private.usuario_global() or private.tem_permissao('suprimentos','aprovar')) then
      raise exception 'Seu perfil não possui permissão para aprovar pedido de compra.';
    end if;
    select count(*),coalesce(sum(valor_total),0) into v_count,v_itens
      from public.pedido_compra_itens where pedido_id=new.id;
    if v_count=0 then raise exception 'Pedido de compra não pode ser aprovado sem itens.'; end if;
    if abs(v_itens-new.valor_total)>0.01 then
      raise exception 'Valor do pedido (%) difere da soma dos itens (%).',new.valor_total,v_itens;
    end if;
    new.aprovado_em:=coalesce(new.aprovado_em,now());
    new.aprovado_por:=coalesce(new.aprovado_por,auth.uid());
  end if;

  if tg_op='UPDATE' and old.status in ('aprovado','parcialmente_recebido','recebido') then
    if new.status='cancelado' then
      if not (private.usuario_global() or private.tem_permissao('suprimentos','aprovar')) then
        raise exception 'Seu perfil não possui permissão para cancelar pedido aprovado.';
      end if;
      select exists(select 1 from public.recebimentos_compra r where r.pedido_id=old.id and r.status='recebido')
          or exists(select 1 from public.nfs n where n.origem_tipo='pedido_compra' and n.origem_id=old.id and n.status in ('aprovada','paga'))
        into v_tem_movimento;
      if v_tem_movimento then
        raise exception 'Pedido com recebimento/NF aprovada não pode ser cancelado diretamente. Registre reversão formal.';
      end if;
    elsif not (
      (old.status='aprovado' and new.status in ('aprovado','parcialmente_recebido','recebido')) or
      (old.status='parcialmente_recebido' and new.status in ('parcialmente_recebido','recebido')) or
      (old.status='recebido' and new.status='recebido')
    ) then
      raise exception 'Transição de status do pedido de compra não permitida.';
    end if;

    if (to_jsonb(new)-array['status','atualizado_em']::text[])
       is distinct from (to_jsonb(old)-array['status','atualizado_em']::text[]) then
      raise exception 'Pedido aprovado é imutável. Cancele/reemita ou use fluxo de alteração.';
    end if;
  end if;

  new.atualizado_em:=now();
  return new;
end $$;
drop trigger if exists pedido_compra_controla_aprovacao on public.pedidos_compra;
drop trigger if exists pedido_compra_controla_aprovacao_insert on public.pedidos_compra;
create trigger pedido_compra_controla_aprovacao
before update of status on public.pedidos_compra
for each row execute function private.controlar_aprovacao_pedido_compra();
create trigger pedido_compra_controla_aprovacao_insert
before insert on public.pedidos_compra
for each row execute function private.controlar_aprovacao_pedido_compra();

create or replace function private.bloquear_item_pedido_aprovado()
returns trigger language plpgsql set search_path='' as $$
declare v_pedido uuid; v_status text;
begin
  v_pedido:=case when tg_op='DELETE' then old.pedido_id else new.pedido_id end;
  select status into v_status from public.pedidos_compra where id=v_pedido;
  if v_status in ('aprovado','parcialmente_recebido','recebido') then
    raise exception 'Itens de pedido aprovado não podem ser alterados diretamente.';
  end if;
  if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists pedido_compra_item_bloqueia_aprovado on public.pedido_compra_itens;
create trigger pedido_compra_item_bloqueia_aprovado
before insert or update or delete on public.pedido_compra_itens
for each row execute function private.bloquear_item_pedido_aprovado();

-- ============================================================
-- 7. RECEBIMENTO NÃO PODE ULTRAPASSAR O PEDIDO
-- ============================================================
create or replace function private.validar_recebimento_compra()
returns trigger language plpgsql set search_path='' as $$
declare v_total numeric; v_recebido numeric; v_status text;
begin
  select valor_total,status into v_total,v_status
  from public.pedidos_compra where id=new.pedido_id and obra_id=new.obra_id;
  if v_total is null then raise exception 'Pedido de compra não encontrado na obra.'; end if;
  if v_status not in ('aprovado','parcialmente_recebido','recebido') then
    raise exception 'Somente pedido aprovado pode receber materiais/serviços.';
  end if;
  select coalesce(sum(valor_recebido),0) into v_recebido
  from public.recebimentos_compra
  where pedido_id=new.pedido_id and status='recebido' and id<>new.id;
  if new.status='recebido' and v_recebido+new.valor_recebido>v_total+0.01 then
    raise exception 'Recebimento acumulado ultrapassa o valor do pedido.';
  end if;
  return new;
end $$;
drop trigger if exists recebimento_compra_valida on public.recebimentos_compra;
create trigger recebimento_compra_valida
before insert or update of pedido_id,obra_id,valor_recebido,status on public.recebimentos_compra
for each row execute function private.validar_recebimento_compra();

create or replace function private.refletir_recebimento_no_pedido()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_total numeric; v_recebido numeric;
begin
  v_id:=case when tg_op='DELETE' then old.pedido_id else new.pedido_id end;
  select valor_total into v_total from public.pedidos_compra where id=v_id;
  select coalesce(sum(valor_recebido),0) into v_recebido
    from public.recebimentos_compra where pedido_id=v_id and status='recebido';
  update public.pedidos_compra
     set status=case when v_recebido>=v_total-0.01 then 'recebido'
                     when v_recebido>0 then 'parcialmente_recebido'
                     else 'aprovado' end,
         atualizado_em=now()
   where id=v_id and status in ('aprovado','parcialmente_recebido','recebido');
  return coalesce(new,old);
end $$;
drop trigger if exists recebimento_compra_reflete_pedido on public.recebimentos_compra;
create trigger recebimento_compra_reflete_pedido
after insert or update of valor_recebido,status or delete on public.recebimentos_compra
for each row execute function private.refletir_recebimento_no_pedido();

-- ============================================================
-- 8. PEDIDO APROVADO -> COMPROMISSO
-- ============================================================
create or replace function private.recalcular_compromisso_pedido_compra(p_pedido uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v public.pedidos_compra%rowtype; v_comp uuid;
begin
  select * into v from public.pedidos_compra where id=p_pedido;
  if not found then raise exception 'Pedido de compra não encontrado.'; end if;

  if v.status not in ('aprovado','parcialmente_recebido','recebido') then
    update public.compromissos set status='cancelado'
    where origem_tipo='pedido_compra' and origem_id=v.id;
    return;
  end if;

  insert into public.compromissos(obra_id,origem_tipo,origem_id,descricao,status,moeda,aprovado_em)
  values(v.obra_id,'pedido_compra',v.id,v.numero||' · '||v.descricao,'ativo',v.moeda,coalesce(v.aprovado_em,now()))
  on conflict(origem_tipo,origem_id) do update
    set obra_id=excluded.obra_id,descricao=excluded.descricao,status='ativo',moeda=excluded.moeda
  returning id into v_comp;

  delete from public.compromisso_itens where compromisso_id=v_comp;
  insert into public.compromisso_itens(obra_id,compromisso_id,eap_id,cbs_id,origem_item_id,descricao,valor_aprovado)
  select v.obra_id,v_comp,i.eap_id,i.cbs_id,i.id,i.descricao,i.valor_total
  from public.pedido_compra_itens i where i.pedido_id=v.id;
end $$;

create or replace function private.trg_compromisso_pedido_compra()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform private.recalcular_compromisso_pedido_compra(new.id);
  return new;
end $$;
drop trigger if exists pedido_compra_sincroniza_compromisso on public.pedidos_compra;
create trigger pedido_compra_sincroniza_compromisso
after insert or update of status,aprovado_em on public.pedidos_compra
for each row execute function private.trg_compromisso_pedido_compra();

-- ============================================================
-- 9. NF DE PEDIDO: LINK POR ITEM PARA APROPRIAÇÃO EAP x CBS
-- ============================================================
alter table public.nf_itens
  add column if not exists pedido_item_id uuid references public.pedido_compra_itens(id) on delete restrict;
create index if not exists ix_nf_itens_pedido_item on public.nf_itens(pedido_item_id);

create or replace function private.validar_nf_item_pedido_compra()
returns trigger language plpgsql set search_path='' as $$
declare v_nf_origem text; v_nf_origem_id uuid; v_pedido_item uuid;
begin
  if new.pedido_item_id is null then return new; end if;
  select origem_tipo,origem_id into v_nf_origem,v_nf_origem_id from public.nfs where id=new.nf_id;
  select pedido_id into v_pedido_item from public.pedido_compra_itens where id=new.pedido_item_id;
  if v_nf_origem<>'pedido_compra' or v_nf_origem_id is distinct from v_pedido_item then
    raise exception 'Item da NF não pertence ao pedido de compra informado como origem.';
  end if;
  return new;
end $$;
drop trigger if exists nf_item_valida_pedido_compra on public.nf_itens;
create trigger nf_item_valida_pedido_compra
before insert or update of nf_id,pedido_item_id on public.nf_itens
for each row execute function private.validar_nf_item_pedido_compra();

create or replace function private.validar_nf_origem_pedido_compra()
returns trigger language plpgsql set search_path='' as $$
declare v_obra uuid; v_status text;
begin
  if new.origem_tipo='pedido_compra' then
    if new.origem_id is null then raise exception 'NF de pedido de compra exige origem_id.'; end if;
    select obra_id,status into v_obra,v_status from public.pedidos_compra where id=new.origem_id;
    if v_obra is null or v_obra<>new.obra_id then raise exception 'Pedido de compra da NF não pertence à mesma obra.'; end if;
    if v_status not in ('aprovado','parcialmente_recebido','recebido') then
      raise exception 'NF só pode referenciar pedido de compra aprovado.';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists nf_valida_origem_pedido_compra on public.nfs;
create trigger nf_valida_origem_pedido_compra
before insert or update of obra_id,origem_tipo,origem_id on public.nfs
for each row execute function private.validar_nf_origem_pedido_compra();

-- Posição financeira: compromisso de contrato é consumido por medição aprovada;
-- compromisso de pedido de compra é consumido por itens de NF aprovada/paga.
create or replace view public.vw_posicao_financeira with (security_invoker=true) as
with orc as (
  select obra_id,eap_id,cbs_id,sum(valor_atual) orcamento_atual
  from public.vw_orcamento_atual group by obra_id,eap_id,cbs_id
), comp_det as (
  select c.obra_id,c.origem_tipo,c.origem_id,i.eap_id,i.cbs_id,sum(i.valor_aprovado) comprometido
  from public.compromissos c join public.compromisso_itens i on i.compromisso_id=c.id
  where c.status='ativo'
  group by c.obra_id,c.origem_tipo,c.origem_id,i.eap_id,i.cbs_id
), atual_contrato as (
  select cc.obra_id,'contrato'::text origem_tipo,cc.id origem_id,ci.eap_id,ci.cbs_id,
         sum(round(mi.quantidade*ci.valor_unitario,2)) realizado
  from public.medicao_itens mi
  join public.contrato_itens ci on ci.id=mi.item_id
  join public.medicoes m on m.id=mi.medicao_id
  join public.contratos_comerciais cc on cc.id=m.contrato_id
  where m.status='aprovada'
  group by cc.obra_id,cc.id,ci.eap_id,ci.cbs_id
), atual_pedido as (
  select n.obra_id,'pedido_compra'::text origem_tipo,n.origem_id,
         pi.eap_id,pi.cbs_id,sum(ni.total_item) realizado
  from public.nfs n
  join public.nf_itens ni on ni.nf_id=n.id and ni.pedido_item_id is not null
  join public.pedido_compra_itens pi on pi.id=ni.pedido_item_id
  where n.origem_tipo='pedido_compra' and n.status in ('aprovada','paga')
  group by n.obra_id,n.origem_id,pi.eap_id,pi.cbs_id
), atual_comp as (
  select * from atual_contrato union all select * from atual_pedido
), comp_ag as (
  select c.obra_id,c.eap_id,c.cbs_id,
         sum(c.comprometido) comprometido,
         sum(coalesce(a.realizado,0)) realizado_compromisso,
         sum(greatest(c.comprometido-coalesce(a.realizado,0),0)) comprometido_restante
  from comp_det c
  left join atual_comp a
    on a.obra_id=c.obra_id and a.origem_tipo=c.origem_tipo and a.origem_id=c.origem_id
   and a.eap_id=c.eap_id and a.cbs_id=c.cbs_id
  group by c.obra_id,c.eap_id,c.cbs_id
), dir as (
  select obra_id,eap_id,cbs_id,sum(valor) realizado_direto
  from public.custos_lancamentos where status='aprovado'
  group by obra_id,eap_id,cbs_id
), fct as (
  select obra_id,eap_id,cbs_id,sum(valor_etc) forecast_nao_comprometido
  from public.forecast_itens where status='ativo'
  group by obra_id,eap_id,cbs_id
), keys as (
  select obra_id,eap_id,cbs_id from orc
  union select obra_id,eap_id,cbs_id from comp_ag
  union select obra_id,eap_id,cbs_id from dir
  union select obra_id,eap_id,cbs_id from fct
)
select k.obra_id,k.eap_id,k.cbs_id,
       coalesce(o.orcamento_atual,0) orcamento_atual,
       coalesce(c.comprometido,0) comprometido,
       coalesce(c.realizado_compromisso,0)+coalesce(d.realizado_direto,0) realizado,
       coalesce(c.comprometido_restante,0) comprometido_restante,
       coalesce(f.forecast_nao_comprometido,0) forecast_nao_comprometido,
       coalesce(c.realizado_compromisso,0)+coalesce(d.realizado_direto,0)+coalesce(c.comprometido_restante,0) valor_apropriado,
       coalesce(o.orcamento_atual,0)-(
         coalesce(c.realizado_compromisso,0)+coalesce(d.realizado_direto,0)+coalesce(c.comprometido_restante,0)
       ) saldo_disponivel,
       coalesce(c.realizado_compromisso,0)+coalesce(d.realizado_direto,0)+coalesce(c.comprometido_restante,0)+coalesce(f.forecast_nao_comprometido,0) forecast_final
from keys k
left join orc o using(obra_id,eap_id,cbs_id)
left join comp_ag c using(obra_id,eap_id,cbs_id)
left join dir d using(obra_id,eap_id,cbs_id)
left join fct f using(obra_id,eap_id,cbs_id);

-- ============================================================
-- 10. RLS / GRANTS
-- ============================================================
alter table public.requisicoes_compra enable row level security;
alter table public.cotacoes_compra enable row level security;
alter table public.pedidos_compra enable row level security;
alter table public.pedido_compra_itens enable row level security;
alter table public.recebimentos_compra enable row level security;

revoke all on public.requisicoes_compra,public.cotacoes_compra,public.pedidos_compra,
  public.pedido_compra_itens,public.recebimentos_compra from anon,authenticated;
grant select,insert,update,delete on public.requisicoes_compra,public.cotacoes_compra,
  public.pedidos_compra,public.pedido_compra_itens,public.recebimentos_compra to authenticated;

-- Cabeçalhos por obra e permissão.
create policy requisicoes_compra_select on public.requisicoes_compra for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','visualizar'));
create policy requisicoes_compra_insert on public.requisicoes_compra for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','criar'));
create policy requisicoes_compra_update on public.requisicoes_compra for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'));
create policy requisicoes_compra_delete on public.requisicoes_compra for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','excluir'));

create policy cotacoes_compra_select on public.cotacoes_compra for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','visualizar'));
create policy cotacoes_compra_insert on public.cotacoes_compra for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','criar'));
create policy cotacoes_compra_update on public.cotacoes_compra for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'));
create policy cotacoes_compra_delete on public.cotacoes_compra for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','excluir'));

create policy pedidos_compra_select on public.pedidos_compra for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','visualizar'));
create policy pedidos_compra_insert on public.pedidos_compra for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','criar'));
create policy pedidos_compra_update on public.pedidos_compra for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'));
create policy pedidos_compra_delete on public.pedidos_compra for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','excluir'));

create policy pedido_compra_itens_select on public.pedido_compra_itens for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','visualizar'));
create policy pedido_compra_itens_insert on public.pedido_compra_itens for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','criar'));
create policy pedido_compra_itens_update on public.pedido_compra_itens for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'));
create policy pedido_compra_itens_delete on public.pedido_compra_itens for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','excluir'));

create policy recebimentos_compra_select on public.recebimentos_compra for select to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','visualizar'));
create policy recebimentos_compra_insert on public.recebimentos_compra for insert to authenticated
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','criar'));
create policy recebimentos_compra_update on public.recebimentos_compra for update to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'))
with check(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','editar'));
create policy recebimentos_compra_delete on public.recebimentos_compra for delete to authenticated
using(private.tem_acesso_obra(obra_id) and private.tem_permissao('suprimentos','excluir'));

-- Auditoria das cinco novas entidades.
do $$ declare t text; begin
  foreach t in array array['requisicoes_compra','cotacoes_compra','pedidos_compra','pedido_compra_itens','recebimentos_compra'] loop
    execute format('drop trigger if exists audit_%I on public.%I',t,t);
    execute format('create trigger audit_%I after insert or update or delete on public.%I for each row execute function private.auditar_mutacao()',t,t);
  end loop;
end $$;

-- Helpers internos nunca expostos à API.
revoke execute on function private.sincronizar_selecao_cotacao_compra() from public,anon,authenticated;
revoke execute on function private.controlar_aprovacao_pedido_compra() from public,anon,authenticated;
revoke execute on function private.bloquear_item_pedido_aprovado() from public,anon,authenticated;
revoke execute on function private.validar_recebimento_compra() from public,anon,authenticated;
revoke execute on function private.refletir_recebimento_no_pedido() from public,anon,authenticated;
revoke execute on function private.recalcular_compromisso_pedido_compra(uuid) from public,anon,authenticated;
revoke execute on function private.trg_compromisso_pedido_compra() from public,anon,authenticated;
revoke execute on function private.validar_nf_item_pedido_compra() from public,anon,authenticated;
revoke execute on function private.validar_nf_origem_pedido_compra() from public,anon,authenticated;

commit;
