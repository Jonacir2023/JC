-- BUILDLy Premium V2.2 — VALIDAÇÃO PÓS-HOMOLOGAÇÃO (READ-ONLY)

-- 1. Novas tabelas e RLS.
select c.relname as tabela,c.relrowsecurity as rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and c.relname in (
    'eap_itens','cbs_codigos','orcamentos','orcamento_itens','orcamento_alteracoes','orcamento_alteracao_itens',
    'fornecedores','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens',
    'custos_lancamentos','pagamentos','forecast_itens','planejamento_cronogramas','planejamento_atividades',
    'planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documento_revisoes',
    'documento_workflow','auditoria_eventos','requisicoes_compra','cotacoes_compra','pedidos_compra',
    'pedido_compra_itens','recebimentos_compra'
  ) order by c.relname;

-- Esperado: 27 linhas e rls=true em todas.

-- 2. Policies por tabela.
select tablename,count(*) as policies
from pg_policies
where schemaname='public'
  and tablename in (
    'eap_itens','cbs_codigos','orcamentos','orcamento_itens','orcamento_alteracoes','orcamento_alteracao_itens',
    'fornecedores','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens',
    'custos_lancamentos','pagamentos','forecast_itens','planejamento_cronogramas','planejamento_atividades',
    'planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documento_revisoes',
    'documento_workflow','auditoria_eventos','requisicoes_compra','cotacoes_compra','pedidos_compra',
    'pedido_compra_itens','recebimentos_compra'
  ) group by tablename order by tablename;

-- Esperado: nenhuma tabela ausente.

-- 3. Views Premium devem usar security_invoker.
select c.relname,coalesce(array_to_string(c.reloptions,','),'') options
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='v'
  and c.relname in ('vw_eap_arvore','vw_cbs_arvore','vw_orcamento_base','vw_orcamento_atual',
                    'vw_contrato_valor_atual','vw_posicao_financeira','vw_nfs_financeiro')
order by c.relname;

-- 4. Não deve haver novos SECURITY DEFINER no schema public.
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prosecdef
order by p.proname;

-- Revisar apenas funções legadas/intencionais. Nenhuma função Premium 05–14 deve aparecer.

-- 5. `anon` deve continuar mínimo.
select table_name,string_agg(privilege_type,', ' order by privilege_type) privilegios
from information_schema.role_table_grants
where table_schema='public' and grantee='anon'
group by table_name order by table_name;

-- Esperado no fluxo atual: INSERT em solicitacoes e nenhum acesso Premium.

-- 6. Grants dos objetos Premium para authenticated.
select table_name,string_agg(privilege_type,', ' order by privilege_type) privilegios
from information_schema.role_table_grants
where table_schema='public' and grantee='authenticated'
  and table_name in ('eap_itens','orcamentos','contratos_comerciais','compromissos','custos_lancamentos',
                     'pagamentos','planejamento_atividades','documento_revisoes','auditoria_eventos','pedidos_compra','recebimentos_compra')
group by table_name order by table_name;

-- 7. Imutabilidade: listar triggers críticos.
select c.relname tabela,t.tgname trigger
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and not t.tgisinternal
  and t.tgname in ('orcamento_protege_aprovado','orc_item_bloqueia_aprovado','orc_alt_bloqueia_aprovada',
                   'contrato_protege_aprovado','contrato_item_bloqueia_aprovado','contrato_alt_bloqueia_aprovada',
                   'medicao_protege_aprovada','medicao_item_bloqueia_aprovada','nf_protege_aprovada',
                   'custo_controla_aprovacao','pagamento_valida_nf','pedido_compra_controla_aprovacao','pedido_compra_item_bloqueia_aprovado','recebimento_compra_valida')
order by c.relname,t.tgname;
