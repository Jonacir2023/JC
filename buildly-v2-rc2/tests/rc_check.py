from pathlib import Path
import re

base=Path(__file__).resolve().parents[1]
sql_dir=base/'sql'
files=sorted(sql_dir.glob('*.sql'))
assert (sql_dir/'00_v1_schema_baseline.sql').exists(), 'Baseline V1 reconstruído ausente'
assert len(files)>=17, f'Esperado >=17 SQLs (baseline + migrations 01..15), encontrado {len(files)}'
all_sql='\n'.join(p.read_text(encoding='utf-8') for p in files)

# Sem marcadores acidentais ou scripts incompletos.
for bad in ['for_placeholder','foreach_dummy','intentionally invalid','TODO_SQL','FIXME_SQL']:
    assert bad not in all_sql, f'Marcador inválido: {bad}'
for p in files:
    s=p.read_text(encoding='utf-8').strip()
    assert s.endswith('commit;'), f'{p.name}: sem commit final'
    assert s.count('$$')%2==0, f'{p.name}: dollar quote desbalanceada'

# Todas as tabelas novas com RLS precisam ter ao menos uma policy em algum ponto do pacote.
created=set(re.findall(r'create\s+table\s+if\s+not\s+exists\s+public\.([a-zA-Z0-9_]+)',all_sql,re.I))
rls=set(re.findall(r'alter\s+table\s+public\.([a-zA-Z0-9_]+)\s+enable\s+row\s+level\s+security',all_sql,re.I))
policy_tables=set(re.findall(r'create\s+policy\s+[a-zA-Z0-9_]+\s+on\s+public\.([a-zA-Z0-9_]+)',all_sql,re.I))
missing_policy=sorted((created & rls)-policy_tables)
assert not missing_policy, f'Tabelas novas com RLS sem policy: {missing_policy}'


# Suprimentos permanece coberto e as extensões recuperadas do RDO também precisam de RLS/policy.
procurement={'requisicoes_compra','cotacoes_compra','pedidos_compra','pedido_compra_itens','recebimentos_compra'}
assert procurement<=rls, f'Tabelas de suprimentos sem RLS: {sorted(procurement-rls)}'
assert procurement<=policy_tables, f'Tabelas de suprimentos sem policy: {sorted(procurement-policy_tables)}'
rdo_premium={'rdo_clima_periodos','rdo_eventos','rdo_assinaturas'}
assert rdo_premium<=rls, f'Tabelas RDO Premium sem RLS: {sorted(rdo_premium-rls)}'
assert rdo_premium<=policy_tables, f'Tabelas RDO Premium sem policy: {sorted(rdo_premium-policy_tables)}'
assert len(created)==30, f'Esperadas 30 tabelas Premium, encontradas {len(created)}'

# Views Premium devem ser security_invoker.
views=set(re.findall(r'create\s+or\s+replace\s+view\s+public\.([a-zA-Z0-9_]+)\s+with\s*\(security_invoker\s*=\s*true\)',all_sql,re.I))
expected_views={'vw_eap_arvore','vw_cbs_arvore','vw_orcamento_base','vw_orcamento_atual','vw_contrato_valor_atual','vw_posicao_financeira','vw_nfs_financeiro'}
assert expected_views<=views, f'Views Premium sem security_invoker: {sorted(expected_views-views)}'

# Nenhuma SECURITY DEFINER nova no schema public nas migrations Premium 05+.
premium='\n'.join(p.read_text(encoding='utf-8') for p in files if p.name[:2].isdigit() and int(p.name[:2])>=5)
public_definer=re.findall(r'create\s+or\s+replace\s+function\s+public\.([a-zA-Z0-9_]+)\([^)]*\).*?security\s+definer',premium,re.I|re.S)
assert not public_definer, f'SECURITY DEFINER público novo: {public_definer}'

# Tabelas críticas devem estar cobertas na Migration 12.
rls12=(sql_dir/'12_rls_premium.sql').read_text(encoding='utf-8')
critical={'fornecedores','contrato_alteracoes','contrato_alteracao_itens','compromissos','compromisso_itens','custos_lancamentos','pagamentos','forecast_itens','planejamento_cronogramas','planejamento_atividades','planejamento_programacoes','planejamento_programacao_itens','planejamento_restricoes','documento_revisoes','documento_workflow','auditoria_eventos'}
pol12=set(re.findall(r'create\s+policy\s+[a-zA-Z0-9_]+\s+on\s+public\.([a-zA-Z0-9_]+)',rls12,re.I))
assert critical<=pol12, f'Migration 12 sem policy para: {sorted(critical-pol12)}'

# Aprovações precisam de ações separadas.
for token in ["('gestor','orcamento','aprovar',true)","('gestor','contratos','aprovar',true)","('gestor','medicoes','aprovar',true)","('gestor','nfs','aprovar',true)","('gestor','custos','aprovar',true)"]:
    assert token in rls12, token

# Frontend RC: persistência/export/reset e cálculo EAP recursivo.
app=(base/'app.js').read_text(encoding='utf-8')
for token in ['STORAGE_KEY','function persist()','function exportDemo()','function resetDemo()','function wbsIds(id)','function financialByWbs(id)','function suppliesPage()']:
    assert token in app, token

print('OK RC package')
print('  migrations:',len(files))
print('  new tables:',len(created))
print('  RLS tables:',len(rls))
print('  policy-covered new RLS tables:',len(created & rls))
print('  premium security_invoker views:',len(expected_views))
