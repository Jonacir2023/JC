-- BUILDLy Premium V2 — Migration 08 (CANDIDATA)
-- Custos diretos, pagamentos, forecast e posição financeira.
begin;

create table if not exists public.custos_lancamentos (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 eap_id uuid not null references public.eap_itens(id) on delete restrict, cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
 data date not null, competencia date, categoria text not null, descricao text not null, valor numeric not null,
 status text not null default 'rascunho', origem_tipo text, origem_id uuid, fornecedor text, documento_id uuid references public.documentos(id) on delete set null,
 criado_em timestamptz not null default now(), criado_por uuid references auth.users(id) on delete set null,
 constraint custos_valor_check check(valor>=0), constraint custos_status_check check(status in ('rascunho','aprovado','cancelado'))
);


alter table public.custos_lancamentos drop constraint if exists custos_lancamentos_eap_id_fkey;
alter table public.custos_lancamentos drop constraint if exists custos_eap_obra_fkey;
alter table public.custos_lancamentos add constraint custos_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

create table if not exists public.pagamentos (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 data date not null, valor numeric not null, origem_tipo text not null, origem_id uuid not null, referencia text,
 status text not null default 'pago', criado_em timestamptz not null default now(),
 constraint pagamentos_valor_check check(valor>=0), constraint pagamentos_status_check check(status in ('programado','pago','cancelado'))
);

create table if not exists public.forecast_itens (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 eap_id uuid not null references public.eap_itens(id) on delete restrict, cbs_id uuid not null references public.cbs_codigos(id) on delete restrict,
 competencia date, descricao text not null, valor_etc numeric not null, status text not null default 'ativo', atualizado_em timestamptz not null default now(),
 constraint forecast_valor_check check(valor_etc>=0), constraint forecast_status_check check(status in ('ativo','substituido','cancelado'))
);


alter table public.forecast_itens drop constraint if exists forecast_itens_eap_id_fkey;
alter table public.forecast_itens drop constraint if exists forecast_eap_obra_fkey;
alter table public.forecast_itens add constraint forecast_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

create or replace view public.vw_posicao_financeira with (security_invoker=true) as
with orc as (
 select obra_id,eap_id,cbs_id,sum(valor_atual) orcamento_atual from public.vw_orcamento_atual group by obra_id,eap_id,cbs_id
), comp as (
 select c.obra_id,i.eap_id,i.cbs_id,sum(i.valor_aprovado) comprometido
 from public.compromissos c join public.compromisso_itens i on i.compromisso_id=c.id where c.status='ativo' group by c.obra_id,i.eap_id,i.cbs_id
), med as (
 select cc.obra_id,ci.eap_id,ci.cbs_id,sum(round(mi.quantidade*ci.valor_unitario,2)) realizado_medido
 from public.medicao_itens mi join public.contrato_itens ci on ci.id=mi.item_id join public.medicoes m on m.id=mi.medicao_id join public.contratos_comerciais cc on cc.id=m.contrato_id
 where m.fechada group by cc.obra_id,ci.eap_id,ci.cbs_id
), dir as (
 select obra_id,eap_id,cbs_id,sum(valor) realizado_direto from public.custos_lancamentos where status='aprovado' group by obra_id,eap_id,cbs_id
), fct as (
 select obra_id,eap_id,cbs_id,sum(valor_etc) forecast_nao_comprometido from public.forecast_itens where status='ativo' group by obra_id,eap_id,cbs_id
), keys as (
 select obra_id,eap_id,cbs_id from orc union select obra_id,eap_id,cbs_id from comp union select obra_id,eap_id,cbs_id from med union select obra_id,eap_id,cbs_id from dir union select obra_id,eap_id,cbs_id from fct
)
select k.obra_id,k.eap_id,k.cbs_id,coalesce(o.orcamento_atual,0) orcamento_atual,coalesce(c.comprometido,0) comprometido,
 coalesce(m.realizado_medido,0)+coalesce(d.realizado_direto,0) realizado,
 greatest(coalesce(c.comprometido,0)-coalesce(m.realizado_medido,0),0) comprometido_restante,
 coalesce(f.forecast_nao_comprometido,0) forecast_nao_comprometido,
 coalesce(m.realizado_medido,0)+coalesce(d.realizado_direto,0)+greatest(coalesce(c.comprometido,0)-coalesce(m.realizado_medido,0),0) valor_apropriado,
 coalesce(o.orcamento_atual,0)-(coalesce(m.realizado_medido,0)+coalesce(d.realizado_direto,0)+greatest(coalesce(c.comprometido,0)-coalesce(m.realizado_medido,0),0)) saldo_disponivel,
 coalesce(m.realizado_medido,0)+coalesce(d.realizado_direto,0)+greatest(coalesce(c.comprometido,0)-coalesce(m.realizado_medido,0),0)+coalesce(f.forecast_nao_comprometido,0) forecast_final
from keys k left join orc o using(obra_id,eap_id,cbs_id) left join comp c using(obra_id,eap_id,cbs_id) left join med m using(obra_id,eap_id,cbs_id) left join dir d using(obra_id,eap_id,cbs_id) left join fct f using(obra_id,eap_id,cbs_id);

alter table public.custos_lancamentos enable row level security; alter table public.pagamentos enable row level security; alter table public.forecast_itens enable row level security;
commit;
