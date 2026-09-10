begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(14);

create or replace function pg_temp.assumir(p_email text)
returns void language plpgsql security definer as $$
declare v uuid;
begin
  select id into v from auth.users where email=p_email;
  if v is null then raise exception 'Usuário TESTE ausente: %',p_email; end if;
  perform set_config('request.jwt.claim.sub',v::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',json_build_object('sub',v::text,'role','authenticated')::text,true);
end $$;

create or replace function pg_temp.tentar_tarefa(p_obra uuid)
returns boolean language plpgsql as $$
begin
  insert into public.tarefas(obra_id,assunto,descricao,origem)
  values(p_obra,'TESTE RLS','registro transitório de homologação','pauta');
  return true;
exception when others then
  return false;
end $$;

-- Especialidades artificiais; todo o arquivo será revertido.
insert into private.perfil_especialidades(user_id,especialidade)
select id,'medicoes_custos' from auth.users where email='eng.medicoes.a@teste.local'
on conflict do nothing;
insert into private.perfil_especialidades(user_id,especialidade)
select id,'planejamento' from auth.users where email='eng.planejamento.a@teste.local'
on conflict do nothing;
insert into private.perfil_especialidades(user_id,especialidade)
select id,x from auth.users cross join (values('medicoes_custos'),('planejamento')) v(x)
where email='eng.completo.a@teste.local' on conflict do nothing;

select pg_temp.assumir('proprietario@teste.local'); set local role authenticated;
select is((select count(*) from public.obras where ativa),2::bigint,'proprietário global vê TESTE-A e TESTE-B');
reset role;

select pg_temp.assumir('gestor.a@teste.local'); set local role authenticated;
select is((select count(*) from public.obras where ativa),1::bigint,'gestor A vê somente uma obra');
select is((select max(codigo) from public.obras where ativa),'TESTE-A','gestor A vê TESTE-A');
select ok(pg_temp.tentar_tarefa('10000000-0000-0000-0000-000000000001'),'gestor A insere tarefa na própria obra');
select ok(not pg_temp.tentar_tarefa('10000000-0000-0000-0000-000000000002'),'gestor A não insere tarefa em TESTE-B');
reset role;

select pg_temp.assumir('engenheiro.a@teste.local'); set local role authenticated;
select ok(private.tem_permissao('rdo','visualizar'),'engenheiro vê RDO');
select ok(not private.tem_permissao('nfs','visualizar'),'engenheiro comum não vê NF');
select ok(not private.tem_permissao('suprimentos','visualizar'),'engenheiro comum não acessa Suprimentos na matriz conservadora FC');
reset role;

select pg_temp.assumir('tecnico.a@teste.local'); set local role authenticated;
select ok(private.tem_permissao('tarefas','visualizar'),'técnico vê Tarefas');
select ok(not private.tem_permissao('medicoes','visualizar'),'técnico não vê Medições');
reset role;

select pg_temp.assumir('administrativo.a@teste.local'); set local role authenticated;
select ok(private.tem_permissao('nfs','visualizar'),'administrativo vê NF');
select ok(private.tem_permissao('suprimentos','visualizar') and private.tem_permissao('suprimentos','criar'),'administrativo opera Suprimentos sem aprovar');
select ok(not private.tem_permissao('medicoes','visualizar'),'administrativo não vê Medições');
reset role;

select pg_temp.assumir('eng.medicoes.a@teste.local'); set local role authenticated;
select ok(private.tem_permissao('custos','visualizar') and private.tem_permissao('nfs','visualizar'),'especialidade Medições/Custos soma permissões');
reset role;

select * from finish();
rollback;
