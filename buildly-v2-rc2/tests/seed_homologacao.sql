-- BUILDLy Premium V2.2 Feature Complete — SEED DE HOMOLOGAÇÃO
-- Somente dados artificiais. Nenhum nome real de obra/cliente.

begin;

insert into public.obras(id,codigo,nome,cidade,uf,ativa,empresa_executora)
values
  ('10000000-0000-0000-0000-000000000001','TESTE-A','TESTE A','Cidade Teste','TS',true,'TESTE'),
  ('10000000-0000-0000-0000-000000000002','TESTE-B','TESTE B','Cidade Teste','TS',true,'TESTE')
on conflict (id) do update set codigo=excluded.codigo,nome=excluded.nome,ativa=true;

insert into public.eap_itens(id,obra_id,pai_id,codigo,nome,tipo,ordem,ativo)
values
  ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',null,'01','TESTE A - Pacote Principal','grupo',10,true),
  ('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','01.01','TESTE A - Serviço','pacote',20,true),
  ('20000000-0000-0000-0000-000000000101','10000000-0000-0000-0000-000000000002',null,'01','TESTE B - Pacote Principal','grupo',10,true),
  ('20000000-0000-0000-0000-000000000102','10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000101','01.01','TESTE B - Serviço','pacote',20,true)
on conflict (id) do nothing;

insert into public.cbs_codigos(id,pai_id,codigo,nome,tipo,ordem,ativo)
values
  ('30000000-0000-0000-0000-000000000001',null,'MAT','TESTE - Materiais','conta',10,true),
  ('30000000-0000-0000-0000-000000000002',null,'SUB','TESTE - Subempreiteiros','conta',20,true),
  ('30000000-0000-0000-0000-000000000003',null,'DIR','TESTE - Custos Diretos','conta',30,true)
on conflict (id) do nothing;

commit;
