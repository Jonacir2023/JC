from pathlib import Path
base=Path(__file__).resolve().parents[1]
app=(base/'app.js').read_text(encoding='utf-8')
sql=(base/'sql/15_rdo_premium.sql').read_text(encoding='utf-8')
doc=(base/'docs/MATRIZ_RDO_RECUPERADO.md').read_text(encoding='utf-8')
for token in [
    'function rdoEditor(r)', 'function rdoSummary()', 'function rdoCalendar()',
    'function rdoReport(r)', 'function rdoAttendanceEditor(r)',
    'function rdoEquipmentEditor(r)', 'function rdoActivitiesEditor(r)',
    'function rdoPhotosEditor(r)', 'openRdoSignature', 'copyPreviousRdo',
    "rdoTab:'diario'", "rdoSummaryMode:'mes'", 'Salvamento automático campo a campo',
    'Eventos de Segurança', 'Eventos de Meio Ambiente', 'Atividades paralisadas',
    'Imprimir / Salvar PDF', 'Calendário', 'DSS — Diálogo Diário de Segurança'
]:
    assert token in app, token
for token in [
    'rdo_clima_periodos','rdo_eventos','rdo_assinaturas',
    'horimetro_inicial','horimetro_final','justificativa_paralisacao',
    'private.tem_acesso_obra','private.tem_permissao'
]:
    assert token in sql, token
assert 'Nenhuma release futura pode ser chamada de `FEATURE COMPLETE`' in doc
assert (base/'docs/reference/RDO_V1_INSTITUIDO.html').stat().st_size>250000
print('OK RDO regression baseline recovered')
