begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select plan(8);

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

select pg_temp.assumir('proprietario@teste.local');
set local role authenticated;

insert into public.fornecedores(id,razao_social,nome_fantasia,cnpj)
values('80000000-0000-0000-0000-000000000001','FORNECEDOR TESTE SUPRIMENTOS','FORNECEDOR TESTE','00.000.000/0001-00');

insert into public.orcamentos(id,obra_id,codigo,nome,status,data_base)
values('80000000-0000-0000-0000-000000000010','10000000-0000-0000-0000-000000000001','ORC-SUP-TESTE','Orçamento Suprimentos TESTE','rascunho',current_date);
insert into public.orcamento_itens(id,obra_id,orcamento_id,eap_id,cbs_id,descricao,valor_base)
values('80000000-0000-0000-0000-000000000011','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000010','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Materiais TESTE',50000000);
update public.orcamentos set status='aprovado' where id='80000000-0000-0000-0000-000000000010';

insert into public.requisicoes_compra(id,obra_id,numero,eap_id,cbs_id,descricao,quantidade,unidade,valor_estimado,status)
values('80000000-0000-0000-0000-000000000020','10000000-0000-0000-0000-000000000001','SC-TESTE-001','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Material TESTE',1,'vb',5000000,'em_cotacao');
select ok(exists(select 1 from public.requisicoes_compra where numero='SC-TESTE-001'),'solicitação de compra criada');

insert into public.cotacoes_compra(id,obra_id,requisicao_id,fornecedor_id,valor_total,prazo_dias,selecionada)
values('80000000-0000-0000-0000-000000000030','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000020','80000000-0000-0000-0000-000000000001',5000000,10,true);
select ok((select selecionada and status='selecionada' from public.cotacoes_compra where id='80000000-0000-0000-0000-000000000030'),'cotação selecionada sincroniza status');

insert into public.pedidos_compra(id,obra_id,requisicao_id,cotacao_id,fornecedor_id,numero,descricao,valor_total,status)
values('80000000-0000-0000-0000-000000000040','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000020','80000000-0000-0000-0000-000000000030','80000000-0000-0000-0000-000000000001','PC-TESTE-001','Pedido TESTE',5000000,'rascunho');
insert into public.pedido_compra_itens(id,obra_id,pedido_id,eap_id,cbs_id,descricao,unidade,quantidade,valor_unitario)
values('80000000-0000-0000-0000-000000000041','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000040','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Item TESTE','vb',1,5000000);
update public.pedidos_compra set status='aprovado' where id='80000000-0000-0000-0000-000000000040';

select is((select sum(ci.valor_aprovado) from public.compromissos c join public.compromisso_itens ci on ci.compromisso_id=c.id where c.origem_tipo='pedido_compra' and c.origem_id='80000000-0000-0000-0000-000000000040' and c.status='ativo'),5000000::numeric,'pedido aprovado compromete R$ 5 mi');
select is((select saldo_disponivel from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000001'),45000000::numeric,'saldo disponível cai para R$ 45 mi');

insert into public.recebimentos_compra(id,obra_id,pedido_id,data,descricao,valor_recebido,recebido_por)
values('80000000-0000-0000-0000-000000000050','10000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000040',current_date,'Recebimento parcial TESTE',2000000,'TESTE');
select is((select status from public.pedidos_compra where id='80000000-0000-0000-0000-000000000040'),'parcialmente_recebido','recebimento parcial atualiza estágio do pedido');

insert into public.nfs(id,obra_id,numero,serie,data,fornecedor,total,status,origem_tipo,origem_id)
values('80000000-0000-0000-0000-000000000060','10000000-0000-0000-0000-000000000001','NF-SUP-TESTE','1',current_date,'FORNECEDOR TESTE',0,'rascunho','pedido_compra','80000000-0000-0000-0000-000000000040');
insert into public.nf_itens(id,nf_id,seq,descricao,unidade,quantidade,preco_unitario,pedido_item_id)
values('80000000-0000-0000-0000-000000000061','80000000-0000-0000-0000-000000000060',1,'Item NF TESTE','vb',1,2000000,'80000000-0000-0000-0000-000000000041');
update public.nfs set status='aprovada' where id='80000000-0000-0000-0000-000000000060';

select is((select realizado from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000001'),2000000::numeric,'NF aprovada do pedido gera R$ 2 mi realizado');
select is((select comprometido_restante from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000001'),3000000::numeric,'compromisso restante do pedido cai para R$ 3 mi');
select is((select saldo_disponivel from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000001'),45000000::numeric,'NF não libera orçamento do pedido');

select * from finish();
rollback;
