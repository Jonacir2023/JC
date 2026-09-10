-- BUILDLy Premium V2 — Migration 09 (CANDIDATA) — Planejamento / Project Controls.
begin;
create table if not exists public.planejamento_cronogramas (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 nome text not null, tipo text not null default 'controle', data_status date, documento_base_id uuid references public.documentos(id) on delete set null,
 ativo boolean not null default true, criado_em timestamptz not null default now(), constraint plan_crono_tipo_check check(tipo in ('baseline','controle','reprogramacao'))
);
create table if not exists public.planejamento_atividades (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 cronograma_id uuid not null references public.planejamento_cronogramas(id) on delete cascade, eap_id uuid not null references public.eap_itens(id) on delete restrict,
 codigo text, nome text not null, inicio_planejado date, fim_planejado date, inicio_real date, fim_real date,
 percentual_planejado numeric not null default 0, percentual_real numeric not null default 0, critica boolean not null default false, responsavel text,
 constraint plan_pct_check check(percentual_planejado between 0 and 100 and percentual_real between 0 and 100)
);
create table if not exists public.planejamento_programacoes (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 tipo text not null, inicio date not null, fim date not null, status text not null default 'rascunho', criado_em timestamptz not null default now(),
 constraint prog_tipo_check check(tipo in ('semanal','quinzenal')), constraint prog_periodo_check check(fim>=inicio), constraint prog_status_check check(status in ('rascunho','publicada','encerrada'))
);
create table if not exists public.planejamento_programacao_itens (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict,
 programacao_id uuid not null, atividade_id uuid, eap_id uuid not null,
 descricao text not null, responsavel text, concluida boolean not null default false, motivo_nao_conclusao text
);

alter table public.planejamento_cronogramas drop constraint if exists planejamento_cronogramas_id_obra_uq;
alter table public.planejamento_cronogramas add constraint planejamento_cronogramas_id_obra_uq unique(id,obra_id);
alter table public.planejamento_atividades drop constraint if exists planejamento_atividades_id_obra_uq;
alter table public.planejamento_atividades add constraint planejamento_atividades_id_obra_uq unique(id,obra_id);
alter table public.planejamento_programacoes drop constraint if exists planejamento_programacoes_id_obra_uq;
alter table public.planejamento_programacoes add constraint planejamento_programacoes_id_obra_uq unique(id,obra_id);

alter table public.planejamento_atividades drop constraint if exists planejamento_atividades_cronograma_id_fkey;
alter table public.planejamento_atividades add constraint plan_atividade_cronograma_obra_fkey
  foreign key (cronograma_id,obra_id) references public.planejamento_cronogramas(id,obra_id) on delete restrict;
alter table public.planejamento_atividades drop constraint if exists planejamento_atividades_eap_id_fkey;
alter table public.planejamento_atividades add constraint plan_atividade_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

alter table public.planejamento_programacao_itens add constraint plan_prog_item_programacao_obra_fkey
  foreign key (programacao_id,obra_id) references public.planejamento_programacoes(id,obra_id) on delete restrict;
alter table public.planejamento_programacao_itens add constraint plan_prog_item_atividade_obra_fkey
  foreign key (atividade_id,obra_id) references public.planejamento_atividades(id,obra_id) on delete restrict;
alter table public.planejamento_programacao_itens add constraint plan_prog_item_eap_obra_fkey
  foreign key (eap_id,obra_id) references public.eap_itens(id,obra_id) on delete restrict;

create table if not exists public.planejamento_restricoes (
 id uuid primary key default gen_random_uuid(), obra_id uuid not null references public.obras(id) on delete restrict, eap_id uuid references public.eap_itens(id) on delete restrict,
 descricao text not null, responsavel text, prazo date, status text not null default 'aberta', criticidade text not null default 'media',
 constraint restr_status_check check(status in ('aberta','resolvida','cancelada')), constraint restr_crit_check check(criticidade in ('baixa','media','alta','critica'))
);
alter table public.planejamento_cronogramas enable row level security; alter table public.planejamento_atividades enable row level security; alter table public.planejamento_programacoes enable row level security; alter table public.planejamento_programacao_itens enable row level security; alter table public.planejamento_restricoes enable row level security;
commit;
