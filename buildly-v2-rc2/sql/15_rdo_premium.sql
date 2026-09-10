-- BUILDLy Premium V2.2 — Migration 15
-- Recuperação funcional do RDO V1 e extensão estruturada para o Premium.
-- CANDIDATA: não aplicar diretamente em produção sem homologação.

begin;

-- 1. Cabeçalho do diário: local, jornada estruturada e workflow.
alter table public.rdos
  add column if not exists local_obra text,
  add column if not exists descricao_local text,
  add column if not exists inicio_jornada time,
  add column if not exists inicio_almoco time,
  add column if not exists fim_almoco time,
  add column if not exists fim_jornada time,
  add column if not exists status text not null default 'rascunho',
  add column if not exists finalizado_em timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='rdos_status_premium_check'
      and conrelid='public.rdos'::regclass
  ) then
    alter table public.rdos
      add constraint rdos_status_premium_check
      check (status in ('rascunho','emitido','cancelado'));
  end if;
end $$;

-- 2. Clima estruturado por período. Mantém clima_manha/clima_tarde da V1
-- para compatibilidade e permite madrugada/noite, chuva e operação.
create table if not exists public.rdo_clima_periodos (
  id uuid primary key default gen_random_uuid(),
  rdo_id uuid not null references public.rdos(id) on delete cascade,
  periodo text not null,
  tempo text,
  chuva_mm numeric(8,2) not null default 0,
  operacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint rdo_clima_periodo_check check (periodo in ('madrugada','manha','tarde','noite')),
  constraint rdo_clima_tempo_check check (tempo is null or tempo in ('sol','nublado','chuva','outro')),
  constraint rdo_clima_chuva_check check (chuva_mm >= 0),
  constraint rdo_clima_operacao_check check (operacao is null or operacao in ('praticavel','impraticavel')),
  constraint rdo_clima_periodo_uq unique (rdo_id, periodo)
);

-- Backfill apenas manhã/tarde quando houver dado V1. É idempotente.
insert into public.rdo_clima_periodos (rdo_id,periodo,tempo,operacao)
select r.id,'manha',
  case lower(coalesce(r.clima_manha,''))
    when 'sol' then 'sol' when 'nublado' then 'nublado' when 'chuva' then 'chuva' else null end,
  case when r.condicao_trabalho='impraticavel' then 'impraticavel' else 'praticavel' end
from public.rdos r
where r.clima_manha is not null
on conflict (rdo_id,periodo) do nothing;

insert into public.rdo_clima_periodos (rdo_id,periodo,tempo,operacao)
select r.id,'tarde',
  case lower(coalesce(r.clima_tarde,''))
    when 'sol' then 'sol' when 'nublado' then 'nublado' when 'chuva' then 'chuva' else null end,
  case when r.condicao_trabalho='impraticavel' then 'impraticavel' else 'praticavel' end
from public.rdos r
where r.clima_tarde is not null
on conflict (rdo_id,periodo) do nothing;

-- 3. Atividades: integração com EAP, status e paralisação.
alter table public.rdo_atividades
  add column if not exists eap_id uuid references public.eap_itens(id) on delete restrict,
  add column if not exists status text not null default 'andamento',
  add column if not exists justificativa_paralisacao text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='rdo_atividades_status_check'
      and conrelid='public.rdo_atividades'::regclass
  ) then
    alter table public.rdo_atividades
      add constraint rdo_atividades_status_check
      check (status in ('andamento','concluida','paralisada','nao_executada'));
  end if;
end $$;

-- 4. Equipamentos: horímetro e estado operacional.
alter table public.rdo_equipamentos
  add column if not exists status text not null default 'operando',
  add column if not exists horimetro_inicial numeric(12,2),
  add column if not exists horimetro_final numeric(12,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='rdo_equipamentos_status_check'
      and conrelid='public.rdo_equipamentos'::regclass
  ) then
    alter table public.rdo_equipamentos
      add constraint rdo_equipamentos_status_check
      check (status in ('operando','parado','manutencao'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname='rdo_equipamentos_horimetro_check'
      and conrelid='public.rdo_equipamentos'::regclass
  ) then
    alter table public.rdo_equipamentos
      add constraint rdo_equipamentos_horimetro_check
      check (horimetro_inicial is null or horimetro_final is null or horimetro_final >= horimetro_inicial);
  end if;
end $$;

-- 5. Fotos: vínculo opcional com uma atividade do próprio RDO.
alter table public.rdo_fotos
  add column if not exists rdo_atividade_id uuid references public.rdo_atividades(id) on delete set null,
  add column if not exists storage_path text;

-- 6. Eventos estruturados de Segurança e Meio Ambiente.
create table if not exists public.rdo_eventos (
  id uuid primary key default gen_random_uuid(),
  rdo_id uuid not null references public.rdos(id) on delete cascade,
  dominio text not null,
  tipo text not null,
  gravidade text,
  descricao text not null,
  acao_tomada text,
  ocorrido_em time,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint rdo_eventos_dominio_check check (dominio in ('seguranca','meio_ambiente')),
  constraint rdo_eventos_gravidade_check check (gravidade is null or gravidade in ('baixa','media','alta','critica')),
  constraint rdo_eventos_tipo_nao_vazio check (btrim(tipo) <> ''),
  constraint rdo_eventos_descricao_nao_vazia check (btrim(descricao) <> '')
);

-- 7. Assinaturas. O backend guarda referência segura do arquivo; a DEMO offline
-- usa dataURL apenas localmente e não envia esse conteúdo para produção.
create table if not exists public.rdo_assinaturas (
  id uuid primary key default gen_random_uuid(),
  rdo_id uuid not null references public.rdos(id) on delete cascade,
  tipo text not null,
  nome text,
  matricula text,
  assinatura_url text,
  assinada_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  constraint rdo_assinaturas_tipo_check check (tipo in ('apontador','fiscalizacao')),
  constraint rdo_assinaturas_slot_uq unique (rdo_id,tipo)
);

create index if not exists rdo_clima_periodos_rdo_idx on public.rdo_clima_periodos(rdo_id);
create index if not exists rdo_eventos_rdo_idx on public.rdo_eventos(rdo_id);
create index if not exists rdo_assinaturas_rdo_idx on public.rdo_assinaturas(rdo_id);
create index if not exists rdo_atividades_eap_idx on public.rdo_atividades(eap_id);

-- 8. RLS completa nos dois objetos novos, combinando escopo da obra + permissão.
alter table public.rdo_clima_periodos enable row level security;
alter table public.rdo_eventos enable row level security;
alter table public.rdo_assinaturas enable row level security;

grant select,insert,update,delete on public.rdo_clima_periodos to authenticated;
grant select,insert,update,delete on public.rdo_eventos to authenticated;
grant select,insert,update,delete on public.rdo_assinaturas to authenticated;
revoke all on public.rdo_clima_periodos from anon;
revoke all on public.rdo_eventos from anon;
revoke all on public.rdo_assinaturas from anon;

-- helper expression is repeated deliberately so each policy is self-contained.
drop policy if exists rdo_clima_periodos_select on public.rdo_clima_periodos;
create policy rdo_clima_periodos_select on public.rdo_clima_periodos
for select to authenticated
using (
  private.tem_permissao('rdo','visualizar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_clima_periodos_insert on public.rdo_clima_periodos;
create policy rdo_clima_periodos_insert on public.rdo_clima_periodos
for insert to authenticated
with check (
  private.tem_permissao('rdo','criar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_clima_periodos_update on public.rdo_clima_periodos;
create policy rdo_clima_periodos_update on public.rdo_clima_periodos
for update to authenticated
using (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
)
with check (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_clima_periodos_delete on public.rdo_clima_periodos;
create policy rdo_clima_periodos_delete on public.rdo_clima_periodos
for delete to authenticated
using (
  private.tem_permissao('rdo','excluir') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);

drop policy if exists rdo_eventos_select on public.rdo_eventos;
create policy rdo_eventos_select on public.rdo_eventos
for select to authenticated
using (
  private.tem_permissao('rdo','visualizar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_eventos_insert on public.rdo_eventos;
create policy rdo_eventos_insert on public.rdo_eventos
for insert to authenticated
with check (
  private.tem_permissao('rdo','criar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_eventos_update on public.rdo_eventos;
create policy rdo_eventos_update on public.rdo_eventos
for update to authenticated
using (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
)
with check (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_eventos_delete on public.rdo_eventos;
create policy rdo_eventos_delete on public.rdo_eventos
for delete to authenticated
using (
  private.tem_permissao('rdo','excluir') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);

drop policy if exists rdo_assinaturas_select on public.rdo_assinaturas;
create policy rdo_assinaturas_select on public.rdo_assinaturas
for select to authenticated
using (
  private.tem_permissao('rdo','visualizar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_assinaturas_insert on public.rdo_assinaturas;
create policy rdo_assinaturas_insert on public.rdo_assinaturas
for insert to authenticated
with check (
  private.tem_permissao('rdo','criar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_assinaturas_update on public.rdo_assinaturas;
create policy rdo_assinaturas_update on public.rdo_assinaturas
for update to authenticated
using (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
)
with check (
  private.tem_permissao('rdo','editar') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);
drop policy if exists rdo_assinaturas_delete on public.rdo_assinaturas;
create policy rdo_assinaturas_delete on public.rdo_assinaturas
for delete to authenticated
using (
  private.tem_permissao('rdo','excluir') and exists (
    select 1 from public.rdos r where r.id=rdo_id and private.tem_acesso_obra(r.obra_id)
  )
);

commit;
