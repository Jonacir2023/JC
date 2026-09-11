-- BUILDLy Premium — Migration 01 (CANDIDATA)
-- Fundação de autorização / RBAC sem substituir as policies atuais.
-- Nenhuma segregação por obra é ativada nesta migration.
-- Nenhum grant atual é revogado nesta migration.

begin;

-- 1. Ampliar papéis base mantendo compatibilidade com os registros existentes.
alter table public.perfis drop constraint if exists perfis_papel_check;
alter table public.perfis
  add constraint perfis_papel_check
  check (papel in (
    'gestor','engenheiro','tecnico','analista',
    'encarregado','apontador','administrativo'
  ));

-- 2. Marcação explícita de proprietário/acesso global.
-- Importante: o valor nasce FALSE. A concessão ao proprietário é um passo
-- operacional separado e auditável; não deve ser inferida automaticamente
-- a partir do papel ou de obra_id nulo.
alter table public.perfis
  add column if not exists acesso_global boolean not null default false;

-- 3. Schema privado para helpers e tabelas de autorização.
create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table if not exists private.papel_permissoes (
  papel text not null,
  modulo text not null,
  acao text not null,
  permitido boolean not null default true,
  primary key (papel, modulo, acao)
);

create table if not exists private.perfil_permissoes (
  user_id uuid not null references auth.users(id) on delete cascade,
  modulo text not null,
  acao text not null,
  permitido boolean not null,
  primary key (user_id, modulo, acao)
);

-- Não permitir acesso direto às tabelas privadas por papéis da API.
revoke all on private.papel_permissoes from public, anon, authenticated;
revoke all on private.perfil_permissoes from public, anon, authenticated;

-- 4. Matriz de acesso a módulos aprovada.
-- Nesta etapa usamos somente a ação 'acessar'; CRUD fino virá depois.
insert into private.papel_permissoes (papel, modulo, acao, permitido)
values
  ('gestor','rdo','acessar',true), ('gestor','cadastro','acessar',true),
  ('gestor','alertas','acessar',true), ('gestor','ocorrencias','acessar',true),
  ('gestor','tarefas','acessar',true), ('gestor','nfs','acessar',true),
  ('gestor','medicoes','acessar',true), ('gestor','reunioes','acessar',true),
  ('gestor','relatorios','acessar',true), ('gestor','documentos','acessar',true),

  ('engenheiro','rdo','acessar',true), ('engenheiro','cadastro','acessar',true),
  ('engenheiro','alertas','acessar',true), ('engenheiro','ocorrencias','acessar',true),
  ('engenheiro','tarefas','acessar',true), ('engenheiro','medicoes','acessar',true),
  ('engenheiro','reunioes','acessar',true), ('engenheiro','relatorios','acessar',true),
  ('engenheiro','documentos','acessar',true),

  ('tecnico','rdo','acessar',true), ('tecnico','cadastro','acessar',true),
  ('tecnico','alertas','acessar',true), ('tecnico','ocorrencias','acessar',true),
  ('tecnico','tarefas','acessar',true),

  ('analista','rdo','acessar',true), ('analista','cadastro','acessar',true),
  ('analista','alertas','acessar',true), ('analista','ocorrencias','acessar',true),
  ('analista','tarefas','acessar',true),

  ('encarregado','rdo','acessar',true), ('encarregado','cadastro','acessar',true),
  ('apontador','rdo','acessar',true), ('apontador','cadastro','acessar',true),

  ('administrativo','rdo','acessar',true), ('administrativo','cadastro','acessar',true),
  ('administrativo','alertas','acessar',true), ('administrativo','ocorrencias','acessar',true),
  ('administrativo','tarefas','acessar',true), ('administrativo','nfs','acessar',true)
on conflict (papel, modulo, acao)
do update set permitido = excluded.permitido;

-- 5. Helpers privados.
-- SECURITY DEFINER fica fora do schema exposto e com search_path vazio.
create or replace function private.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.ativo = true
  );
$$;

create or replace function private.usuario_global()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.ativo = true
      and p.acesso_global = true
  );
$$;

create or replace function private.tem_acesso_obra(p_obra_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis p
    where p.id = (select auth.uid())
      and p.ativo = true
      and (p.acesso_global = true or p.obra_id = p_obra_id)
  );
$$;

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

-- 6. Proteger o campo mais sensível desta migration contra escalada de privilégio.
-- Alterações feitas pelo SQL administrativo (auth.uid() IS NULL) continuam possíveis.
create or replace function private.protege_acesso_global()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.acesso_global is distinct from old.acesso_global then
    if (select auth.uid()) is not null
       and not (select private.usuario_global()) then
      raise exception 'Somente o proprietário global pode alterar acesso_global.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists perfis_protege_acesso_global on public.perfis;
create trigger perfis_protege_acesso_global
before update of acesso_global on public.perfis
for each row execute function private.protege_acesso_global();

-- 7. Privilégios de funções privadas.
-- As policies futuras poderão referenciá-las por OID. Não abrimos o schema
-- privado para a Data API nem concedemos acesso às tabelas privadas.
revoke all on function private.usuario_ativo() from public, anon;
revoke all on function private.usuario_global() from public, anon;
revoke all on function private.tem_acesso_obra(uuid) from public, anon;
revoke all on function private.tem_permissao(text, text) from public, anon;
revoke all on function private.protege_acesso_global() from public, anon, authenticated;

grant execute on function private.usuario_ativo() to authenticated;
grant execute on function private.usuario_global() to authenticated;
grant execute on function private.tem_acesso_obra(uuid) to authenticated;
grant execute on function private.tem_permissao(text, text) to authenticated;

-- Não mudamos policies nesta Migration 01.
-- Não revogamos grants das tabelas públicas nesta Migration 01.
-- Não promovemos nenhum usuário automaticamente para acesso_global.

commit;
