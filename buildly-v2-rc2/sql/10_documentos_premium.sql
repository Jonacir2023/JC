-- BUILDLy Premium V2 — Migration 10 (CANDIDATA) — GED / revisões / workflows.
begin;
alter table public.documentos
 add column if not exists codigo text, add column if not exists disciplina text, add column if not exists tipo_documento text,
 add column if not exists revisao text not null default '00', add column if not exists status_documental text not null default 'rascunho',
 add column if not exists emissor text, add column if not exists data_documento date, add column if not exists supersede_id uuid references public.documentos(id) on delete restrict;
create table if not exists public.documento_revisoes (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 documento_id uuid not null references public.documentos(id) on delete restrict, revisao text not null, url text not null, arquivo_nome text,
 status text not null, emitido_em timestamptz not null default now(), emitido_por text, comentario text,
 constraint doc_rev_uq unique(documento_id,revisao)
);
create table if not exists public.documento_workflow (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 revisao_id uuid not null references public.documento_revisoes(id) on delete restrict, etapa integer not null, responsavel text,
 decisao text, decidido_em timestamptz, comentario text,
 constraint doc_wf_decisao_check check(decisao is null or decisao in ('aprovado','aprovado_com_comentarios','rejeitado','comentado'))
);

alter table public.documento_revisoes drop constraint if exists documento_revisoes_id_obra_uq;
alter table public.documento_revisoes add constraint documento_revisoes_id_obra_uq unique(id,obra_id);
alter table public.documento_workflow drop constraint if exists documento_workflow_revisao_id_fkey;
alter table public.documento_workflow add constraint documento_workflow_revisao_obra_fkey
  foreign key (revisao_id,obra_id) references public.documento_revisoes(id,obra_id) on delete restrict;

alter table public.documento_revisoes enable row level security; alter table public.documento_workflow enable row level security;
commit;
