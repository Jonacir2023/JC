-- BUILDLy Premium — Migration 04A (CANDIDATA)
-- Matriz CRUD + especialidades.
-- Esta migration NÃO substitui policies RLS ainda.
-- Ela apenas prepara a autorização para a Migration 04B.

begin;

-- ============================================================
-- 1. ESPECIALIDADES
-- ============================================================

create table if not exists private.especialidades (
  codigo text primary key,
  nome text not null,
  ativo boolean not null default true
);

create table if not exists private.perfil_especialidades (
  user_id uuid not null references auth.users(id) on delete cascade,
  especialidade text not null references private.especialidades(codigo) on delete cascade,
  primary key (user_id, especialidade)
);

create table if not exists private.especialidade_permissoes (
  especialidade text not null references private.especialidades(codigo) on delete cascade,
  modulo text not null,
  acao text not null,
  permitido boolean not null default true,
  primary key (especialidade, modulo, acao)
);

revoke all on private.especialidades from public, anon, authenticated;
revoke all on private.perfil_especialidades from public, anon, authenticated;
revoke all on private.especialidade_permissoes from public, anon, authenticated;

insert into private.especialidades (codigo, nome, ativo)
values
  ('medicoes_custos', 'Engenheiro de Medições / Custos', true),
  ('planejamento', 'Engenheiro de Planejamento', true)
on conflict (codigo) do update
set nome=excluded.nome, ativo=excluded.ativo;

-- ============================================================
-- 2. AÇÕES BASE POR PAPEL
-- ============================================================

-- Limpar somente as ações CRUD/gerar desta matriz para permitir rerun controlado.
delete from private.papel_permissoes
where acao in ('visualizar','criar','editar','excluir','gerar')
   or modulo in ('custos','planejamento');

-- GESTOR DA OBRA: irrestrito na própria obra.
insert into private.papel_permissoes (papel, modulo, acao, permitido)
select 'gestor', m.modulo, a.acao, true
from (values
  ('rdo'),('cadastro'),('alertas'),('ocorrencias'),('tarefas'),
  ('nfs'),('medicoes'),('reunioes'),('documentos'),('custos'),('planejamento')
) m(modulo)
cross join (values ('visualizar'),('criar'),('editar'),('excluir')) a(acao)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

insert into private.papel_permissoes (papel, modulo, acao, permitido)
values
  ('gestor','relatorios','visualizar',true),
  ('gestor','relatorios','gerar',true),
  ('gestor','custos','acessar',true),
  ('gestor','planejamento','acessar',true)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

-- ENGENHEIRO BASE
insert into private.papel_permissoes (papel, modulo, acao, permitido)
values
  ('engenheiro','rdo','visualizar',true),
  ('engenheiro','rdo','criar',true),
  ('engenheiro','rdo','editar',true),
  ('engenheiro','rdo','excluir',true),

  ('engenheiro','cadastro','visualizar',true),
  ('engenheiro','cadastro','criar',true),
  ('engenheiro','cadastro','editar',true),
  ('engenheiro','cadastro','excluir',true),

  ('engenheiro','alertas','visualizar',true),

  ('engenheiro','ocorrencias','visualizar',true),
  ('engenheiro','ocorrencias','criar',true),
  ('engenheiro','ocorrencias','editar',true),
  ('engenheiro','ocorrencias','excluir',true),

  ('engenheiro','tarefas','visualizar',true),
  ('engenheiro','tarefas','criar',true),
  ('engenheiro','tarefas','editar',true),

  ('engenheiro','medicoes','visualizar',true),
  ('engenheiro','medicoes','criar',true),
  ('engenheiro','medicoes','editar',true),

  ('engenheiro','reunioes','visualizar',true),
  ('engenheiro','reunioes','criar',true),
  ('engenheiro','reunioes','editar',true),

  ('engenheiro','relatorios','visualizar',true),
  ('engenheiro','relatorios','gerar',true),

  ('engenheiro','documentos','visualizar',true),
  ('engenheiro','documentos','criar',true),
  ('engenheiro','documentos','editar',true)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

-- TÉCNICO / ANALISTA
insert into private.papel_permissoes (papel, modulo, acao, permitido)
select p.papel, m.modulo, a.acao, true
from (values ('tecnico'),('analista')) p(papel)
cross join (values ('rdo'),('cadastro'),('ocorrencias'),('tarefas')) m(modulo)
cross join (values ('visualizar'),('criar'),('editar')) a(acao)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

insert into private.papel_permissoes (papel, modulo, acao, permitido)
values ('tecnico','alertas','visualizar',true),
       ('analista','alertas','visualizar',true)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

-- ENCARREGADO / APONTADOR
insert into private.papel_permissoes (papel, modulo, acao, permitido)
select p.papel, m.modulo, a.acao, true
from (values ('encarregado'),('apontador')) p(papel)
cross join (values ('rdo'),('cadastro')) m(modulo)
cross join (values ('visualizar'),('criar'),('editar')) a(acao)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

-- ADMINISTRATIVO
insert into private.papel_permissoes (papel, modulo, acao, permitido)
select 'administrativo', m.modulo, a.acao, true
from (values ('rdo'),('cadastro'),('ocorrencias'),('tarefas'),('nfs'),('custos')) m(modulo)
cross join (values ('visualizar'),('criar'),('editar')) a(acao)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

insert into private.papel_permissoes (papel, modulo, acao, permitido)
values
  ('administrativo','alertas','visualizar',true),
  ('administrativo','custos','acessar',true)
on conflict (papel,modulo,acao) do update set permitido=excluded.permitido;

-- ============================================================
-- 3. ESPECIALIDADES DE ENGENHARIA
-- ============================================================

delete from private.especialidade_permissoes
where especialidade in ('medicoes_custos','planejamento');

insert into private.especialidade_permissoes
  (especialidade, modulo, acao, permitido)
values
  ('medicoes_custos','nfs','acessar',true),
  ('medicoes_custos','nfs','visualizar',true),
  ('medicoes_custos','nfs','criar',true),
  ('medicoes_custos','nfs','editar',true),

  ('medicoes_custos','custos','acessar',true),
  ('medicoes_custos','custos','visualizar',true),
  ('medicoes_custos','custos','criar',true),
  ('medicoes_custos','custos','editar',true),

  ('planejamento','planejamento','acessar',true),
  ('planejamento','planejamento','visualizar',true),
  ('planejamento','planejamento','criar',true),
  ('planejamento','planejamento','editar',true)
on conflict (especialidade,modulo,acao)
do update set permitido=excluded.permitido;

-- ============================================================
-- 4. TEM_PERMISSAO V2
--
-- Precedência:
-- 1) proprietário global => true
-- 2) override individual em perfil_permissoes
-- 3) qualquer especialidade ativa concedendo a ação
-- 4) papel base
-- 5) false
-- ============================================================

create or replace function private.tem_permissao(
  p_modulo text,
  p_acao text default 'acessar'
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.perfis p
      where p.id = (select auth.uid())
        and p.ativo = true
        and p.acesso_global = true
    ) then true
    else coalesce(
      (
        select u.permitido
        from private.perfil_permissoes u
        where u.user_id = (select auth.uid())
          and u.modulo = p_modulo
          and u.acao = p_acao
      ),
      (
        select true
        where exists (
          select 1
          from private.perfil_especialidades pe
          join private.especialidades e
            on e.codigo = pe.especialidade and e.ativo
          join private.especialidade_permissoes ep
            on ep.especialidade = pe.especialidade
          where pe.user_id = (select auth.uid())
            and ep.modulo = p_modulo
            and ep.acao = p_acao
            and ep.permitido = true
        )
      ),
      (
        select pp.permitido
        from public.perfis p
        join private.papel_permissoes pp on pp.papel = p.papel
        where p.id = (select auth.uid())
          and p.ativo = true
          and pp.modulo = p_modulo
          and pp.acao = p_acao
      ),
      false
    )
  end;
$$;

revoke all on function private.tem_permissao(text,text) from public, anon;
grant execute on function private.tem_permissao(text,text) to authenticated;

commit;
