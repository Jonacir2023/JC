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

select pg_temp.assumir('proprietario@teste.local');
set local role authenticated;

-- Baseline: R$ 100 mi.
insert into public.orcamentos(id,obra_id,codigo,nome,status,data_base)
values('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','ORC-TESTE','Orçamento TESTE','rascunho',current_date);
insert into public.orcamento_itens(id,obra_id,orcamento_id,eap_id,cbs_id,descricao,valor_base)
values('41000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Baseline TESTE',100000000);
update public.orcamentos set status='aprovado' where id='40000000-0000-0000-0000-000000000001';
select is((select sum(valor_atual) from public.vw_orcamento_atual where orcamento_id='40000000-0000-0000-0000-000000000001'),100000000::numeric,'orçamento atual inicia em R$ 100 mi');

-- Contrato aprovado: R$ 12 mi → compromisso imediato.
insert into public.contratos_comerciais(id,obra_id,tipo,nome,empresa,especialidade,numero_contrato,status)
values('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','empreiteiro','Contrato TESTE','TESTE','TESTE','CT-TESTE-001','rascunho');
insert into public.contrato_itens(id,contrato_id,item,descricao,unidade,quantidade,valor_unitario,eap_id,cbs_id)
values('51000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','001','Serviço TESTE','vb',1,12000000,'20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002');
update public.contratos_comerciais set status='aprovado' where id='50000000-0000-0000-0000-000000000001';
select is((select sum(ci.valor_aprovado) from public.compromissos c join public.compromisso_itens ci on ci.compromisso_id=c.id where c.origem_id='50000000-0000-0000-0000-000000000001' and c.status='ativo'),12000000::numeric,'contrato aprovado compromete R$ 12 mi');
select is((select saldo_disponivel from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),88000000::numeric,'saldo cai para R$ 88 mi');

-- Medição de R$ 3 mi migra estágio, sem liberar orçamento.
insert into public.medicoes(id,contrato_id,numero,mes_referencia,data_inicio,data_fim,status)
values('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',1,'TESTE',current_date,current_date,'rascunho');
insert into public.medicao_itens(id,medicao_id,item_id,quantidade)
values('61000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','51000000-0000-0000-0000-000000000001',0.25);
update public.medicoes set status='aprovada' where id='60000000-0000-0000-0000-000000000001';
select is((select realizado from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),3000000::numeric,'medição aprovada gera R$ 3 mi realizado');
select is((select comprometido_restante from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),9000000::numeric,'comprometido restante vira R$ 9 mi');
select is((select saldo_disponivel from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),88000000::numeric,'medição não libera orçamento');

-- Aditivo + R$ 2 mi recalcula compromisso automaticamente.
insert into public.contrato_alteracoes(id,obra_id,contrato_id,numero,tipo,descricao,status,valor_delta)
values('70000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',1,'aditivo_valor','Aditivo TESTE','rascunho',2000000);
insert into public.contrato_alteracao_itens(id,obra_id,alteracao_id,eap_id,cbs_id,descricao,valor_delta)
values('71000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Aditivo TESTE',2000000);
update public.contrato_alteracoes set status='aprovada' where id='70000000-0000-0000-0000-000000000001';
select is((select sum(ci.valor_aprovado) from public.compromissos c join public.compromisso_itens ci on ci.compromisso_id=c.id where c.origem_id='50000000-0000-0000-0000-000000000001' and c.status='ativo'),14000000::numeric,'aditivo aumenta compromisso para R$ 14 mi');
select is((select saldo_disponivel from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),86000000::numeric,'saldo após aditivo é R$ 86 mi');
select is((select valor_apropriado from public.vw_posicao_financeira where obra_id='10000000-0000-0000-0000-000000000001' and eap_id='20000000-0000-0000-0000-000000000002' and cbs_id='30000000-0000-0000-0000-000000000002'),14000000::numeric,'valor apropriado permanece sem dupla contagem');
select ok((select status='aprovada' and fechada from public.medicoes where id='60000000-0000-0000-0000-000000000001'),'medição aprovada fica fechada');

-- Correções de integridade descobertas na bateria de testes FC1.
select throws_ok(
  $$insert into public.custos_lancamentos(obra_id,eap_id,cbs_id,data,categoria,descricao,valor,status)
    values('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',current_date,'TESTE','Custo aprovado direto TESTE',1000,'aprovado')$$,
  'Crie o custo em rascunho e depois aprove.',
  'custo não pode nascer diretamente aprovado'
);

insert into public.medicoes(id,contrato_id,numero,mes_referencia,data_inicio,data_fim,status)
values('60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000001',2,'TESTE',current_date,current_date,'rascunho');

select throws_ok(
  $$insert into public.medicao_itens(id,medicao_id,item_id,quantidade)
    values('61000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','51000000-0000-0000-0000-000000000001',0.80)$$,
  'Quantidade medida acumulada ultrapassa a quantidade contratada.',
  'medição acumulada não ultrapassa quantidade contratada'
);

insert into public.contratos_comerciais(id,obra_id,tipo,nome,empresa,especialidade,numero_contrato,status)
values('50000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','empreiteiro','Contrato TESTE 2','TESTE','TESTE','CT-TESTE-002','rascunho');
insert into public.contrato_itens(id,contrato_id,item,descricao,unidade,quantidade,valor_unitario,eap_id,cbs_id)
values('51000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','001','Serviço TESTE 2','vb',1,1000,'20000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002');

select throws_ok(
  $$insert into public.medicao_itens(id,medicao_id,item_id,quantidade)
    values('61000000-0000-0000-0000-000000000003','60000000-0000-0000-0000-000000000002','51000000-0000-0000-0000-000000000002',0.10)$$,
  'Item de medição pertence a contrato diferente do boletim.',
  'item de outro contrato não entra no boletim'
);

select throws_ok(
  $$update public.medicoes set status='aprovada' where id='60000000-0000-0000-0000-000000000002'$$,
  'Medição não pode ser aprovada sem itens medidos.',
  'medição vazia não pode ser aprovada'
);

select * from finish();
rollback;
