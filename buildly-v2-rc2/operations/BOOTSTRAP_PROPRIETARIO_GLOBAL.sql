-- BUILDLy Premium — bootstrap operacional do proprietário global
-- EXECUTAR EM PRODUÇÃO SOMENTE APÓS 01_seguranca.sql e antes de 03_rls_multiobra.sql.
-- Não é migration. É uma configuração administrativa única.
-- Falha de propósito se não houver exatamente um gestor ativo sem obra.

do $$
declare
  v_id uuid;
  v_qtd integer;
begin
  select count(*), min(id::text)::uuid
    into v_qtd, v_id
  from public.perfis
  where papel = 'gestor'
    and ativo = true
    and obra_id is null;

  if v_qtd <> 1 then
    raise exception 'Bootstrap abortado: esperado 1 gestor ativo sem obra; encontrados %.', v_qtd;
  end if;

  update public.perfis
     set acesso_global = true
   where id = v_id;

  if not exists (
    select 1 from public.perfis
     where id = v_id and acesso_global = true and ativo = true
  ) then
    raise exception 'Bootstrap abortado: proprietário global não foi confirmado.';
  end if;
end $$;
