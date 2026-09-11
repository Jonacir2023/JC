from pathlib import Path
base=Path(__file__).resolve().parents[1]
required=['index.html','styles.css','data.js','app.js','manifest.json','sw.js','BUILDLy_Premium_V2_STANDALONE_OFFLINE.html','ABRIR_BUILDLY_OFFLINE.command']
for f in required:
    p=base/f
    assert p.exists() and p.stat().st_size>0,f'Missing {f}'
html=(base/'index.html').read_text()
for token in ['id="tree"','id="content"','data.js','app.js']:
    assert token in html,token
js=(base/'app.js').read_text()
for token in ['function financial()','function contractsPage()','function budgetPage()','function planningPage()','function rdoPage()','function suppliesPage()','function brainPage()','function auditPage()','function eapPage()']:
    assert token in js,token
sql=list((base/'sql').glob('*.sql'))
assert len(sql)>=11,len(sql)
print('OK static package:',len(sql),'SQL files')

# Colunas GENERATED ALWAYS do baseline nunca podem receber atribuição em migrations.
combined = '\n'.join(x.read_text(encoding='utf-8') for x in sql)
compact = combined.replace(' ','')
for generated_col in ('valor_total','total_item','fim_experiencia_1','fim_experiencia_2'):
    assert f'new.{generated_col}:=' not in compact, f'escrita indevida em coluna gerada: {generated_col}'

# Kit de homologação local deve permanecer completo.
for rel in (
    'scripts/preparar_homologacao_local.sh',
    'scripts/criar_usuarios_teste.sh',
    'tests/seed_homologacao.sql',
    'tests/pgtap/001_estrutura.test.sql',
    'tests/pgtap/002_rls.test.sql',
    'tests/pgtap/003_financeiro.test.sql',
    'docs/HOMOLOGACAO_LOCAL_MAC.md',
):
    q=base/rel
    assert q.exists() and q.stat().st_size>0, f'kit de homologação ausente: {rel}'
assert 'private.calcular_valor_contrato_item()' not in (base/'sql/12_rls_premium.sql').read_text(), 'referência residual à função removida'


# Pre-flight de produção deve listar exatamente as tabelas Premium realmente criadas.
import re
created=set()
for f in sql:
    if f.name.startswith('00_'):
        continue
    txt=f.read_text(encoding='utf-8')
    for m in re.finditer(r'create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-zA-Z0-9_]+)',txt,re.I):
        created.add(m.group(1))
preflight=(base/'production/PREFLIGHT_PRODUCAO_READONLY.sql').read_text(encoding='utf-8')
block=re.search(r'with\s+premium_names\(name\)\s+as\s*\(values(.*?)\)\s*select\s+count\(\*\)\s+into\s+v_collisions',preflight,re.I|re.S)
assert block, 'lista premium_names não encontrada no pre-flight'
listed=set(re.findall(r"\('([a-zA-Z0-9_]+)'\)",block.group(1)))
assert listed==created, f'pre-flight diverge das tabelas Premium: faltam={created-listed}, sobram={listed-created}'
assert len(created)==30, f'esperadas 30 tabelas Premium, encontradas {len(created)}'

# DEMO e exemplos visuais nunca podem conter nomes reais de obra/fornecedores.
for rel in ('data.js','app.js','BUILDLy_Premium_V2_STANDALONE.html','BUILDLy_Premium_V2_STANDALONE_OFFLINE.html','docs/ARVORE_DA_OBRA.md'):
    txt=(base/rel).read_text(encoding='utf-8').lower()
    for forbidden in ('escala','uberaba','agroterra','drena minas','concrefort','eletromec','transobra','verdesul'):
        assert forbidden not in txt, f'nome real proibido em {rel}: {forbidden}'

assert (base/'sql/14_suprimentos.sql').exists(), 'Migration 14 Suprimentos ausente'
assert (base/'sql/15_rdo_premium.sql').exists(), 'Migration 15 RDO Premium ausente'


# Correções da primeira bateria de testes FC1.
app=(base/'app.js').read_text(encoding='utf-8')
assert "['aprovada','conferida'].includes(n.status)" not in app, 'NF conferida não pode exibir pagamento'
assert "n.status==='aprovada'&&can('custos','approve')" in app, 'pagamento deve exigir NF aprovada + custos.aprovar'
assert "parcialmente_recebido" in app and 'function poBalance(p)' in app, 'recebimento parcial do pedido não implementado'
assert "Transferência/reclassificação precisa ter origem e destino balanceados." in app, 'gate de transferência orçamentária ausente'
for forbidden in (
    "{value:'aprovado',label:'Aprovado'}]))}</div><div class=\"modal-actions\">${btn('Salvar','saveContract'",
    "{value:'aprovada',label:'Aprovada'}]))}</div><div class=\"modal-actions\">${btn('Salvar','saveMeasurement'",
):
    assert forbidden not in app, 'modal de criação permite nascer aprovado'

wf=(base/'sql/13_workflows_financeiros.sql').read_text(encoding='utf-8')
for token in (
    'private.validar_integridade_medicao_item()',
    'Quantidade medida acumulada ultrapassa a quantidade contratada.',
    'Item de medição pertence a contrato diferente do boletim.',
    'Medição não pode ser aprovada sem itens medidos.',
    'Crie o custo em rascunho e depois aprove.',
):
    assert token in wf, token

assert (base/'tests/business_logic.js').exists(), 'teste de lógica real do app ausente'
